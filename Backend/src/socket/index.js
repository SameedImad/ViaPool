import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

            if (!token && socket.handshake.headers.cookie) {
                const cookieStr = socket.handshake.headers.cookie;
                const match = cookieStr.match(/accessToken=([^;]+)/);
                if (match) token = match[1];
            }

            if (!token) {
                return next(new Error("Authentication error: Token missing"));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded?._id).select("-password -refreshToken");

            if (!user || user.isBlocked) {
                return next(new Error("Authentication error: Invalid or blocked user"));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: " + err.message));
        }
    });

    io.on("connection", (socket) => {
        console.log("New authenticated client connected", socket.user._id.toString());

        // User joining their personal room for notifications
        socket.on("join-user-room", (userId) => {
            if (userId !== socket.user._id.toString()) {
                console.log(`User ${socket.user._id} tried to join room ${userId}`);
                return;
            }
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their personal room`);
        });

        // Driver joining a ride room to broadcast location
        socket.on("join-ride-room", (rideId) => {
            socket.join(`ride_${rideId}`);
            console.log(`Joined ride room ${rideId}`);
        });

        // Driver sending location updates
        socket.on("location-update", (data) => {
            if (socket.user.role !== "driver") return; // Basic authorization
            const { rideId, lat, lng } = data;
            // Broadcast to all passengers in the ride room
            io.to(`ride_${rideId}`).emit("driver-location", { lat, lng });
        });

        // Messaging between driver and passenger
        socket.on("send-message", async (data) => {
            const { rideId, senderId, receiverId, message } = data;

            if (senderId !== socket.user._id.toString()) return; // Must send as self

            try {
                // Save to DB
                const newMessage = await Message.create({
                    ride: rideId,
                    sender: senderId,
                    receiver: receiverId,
                    message
                });

                // Emit to receiver's personal room
                io.to(`user_${receiverId}`).emit("receive-message", newMessage);
            } catch (error) {
                console.error("Error saving message", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });

    return io;
};
