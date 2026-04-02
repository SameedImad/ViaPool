import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (!allowedOrigins.length || allowedOrigins.includes("*")) return true;
    return allowedOrigins.includes(origin);
};

const connectedUsers = new Map();

const setUserSocketConnected = (userId, socketId) => {
    if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, new Set());
    }

    connectedUsers.get(userId).add(socketId);
};

const setUserSocketDisconnected = (userId, socketId) => {
    const sockets = connectedUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
        connectedUsers.delete(userId);
    }
};

const isUserOnline = (userId) => connectedUsers.has(userId);

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                    callback(null, true);
                    return;
                }

                callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
            },
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
        const currentUserId = socket.user._id.toString();
        setUserSocketConnected(currentUserId, socket.id);
        io.to(`presence_watch_${currentUserId}`).emit("user-presence", {
            userId: currentUserId,
            online: true,
        });
        console.log("New authenticated client connected", currentUserId);

        // User joining their personal room for notifications
        socket.on("join-user-room", (userId) => {
            if (userId !== socket.user._id.toString()) {
                console.log(`User ${socket.user._id} tried to join room ${userId}`);
                return;
            }
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their personal room`);
        });

        socket.on("watch-user", (userId) => {
            if (!userId) return;
            socket.join(`presence_watch_${userId}`);
            socket.emit("user-presence", {
                userId,
                online: isUserOnline(userId),
            });
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

        socket.on("passenger-location-update", (data) => {
            if (socket.user.role !== "passenger") return;
            const { rideId, lat, lng } = data;
            io.to(`ride_${rideId}`).emit("passenger-location", {
                userId: currentUserId,
                lat,
                lng,
            });
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

                const populatedMessage = await Message.findById(newMessage._id).lean();
                const sender = await User.findById(senderId).select("firstName lastName").lean();

                const notification = await Notification.create({
                    user: receiverId,
                    type: "new_message",
                    message: `New message from ${sender?.firstName || "ViaPool user"}`,
                    relatedId: newMessage._id,
                });

                // Emit to both sender and receiver personal rooms so every active chat stays in sync
                io.to(`user_${receiverId}`).emit("receive-message", populatedMessage);
                io.to(`user_${senderId}`).emit("receive-message", populatedMessage);
                io.to(`user_${receiverId}`).emit("notification:new", notification.toObject());
            } catch (error) {
                console.error("Error saving message", error);
            }
        });

        socket.on("typing-start", ({ rideId, receiverId, senderId }) => {
            if (senderId !== currentUserId || !receiverId) return;
            io.to(`user_${receiverId}`).emit("typing-status", {
                rideId,
                senderId,
                isTyping: true,
            });
        });

        socket.on("typing-stop", ({ rideId, receiverId, senderId }) => {
            if (senderId !== currentUserId || !receiverId) return;
            io.to(`user_${receiverId}`).emit("typing-status", {
                rideId,
                senderId,
                isTyping: false,
            });
        });

        socket.on("disconnect", () => {
            setUserSocketDisconnected(currentUserId, socket.id);
            if (!isUserOnline(currentUserId)) {
                io.to(`presence_watch_${currentUserId}`).emit("user-presence", {
                    userId: currentUserId,
                    online: false,
                });
            }
            console.log("Client disconnected", socket.id);
        });
    });

    return io;
};
