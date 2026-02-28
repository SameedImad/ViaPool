import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        // User joining their personal room for notifications
        socket.on("join-user-room", (userId) => {
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
            const { rideId, lat, lng } = data;
            // Broadcast to all passengers in the ride room
            io.to(`ride_${rideId}`).emit("driver-location", { lat, lng });
        });

        // Messaging between driver and passenger
        socket.on("send-message", async (data) => {
            const { rideId, senderId, receiverId, message } = data;

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
