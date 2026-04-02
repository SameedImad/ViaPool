import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMessages = asyncHandler(async (req, res) => {
  const { rideId, otherUserId } = req.params;

  const messages = await Message.find({
    ride: rideId,
    $or: [
      { sender: req.user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user._id }
    ]
  }).sort({ createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

const markConversationRead = asyncHandler(async (req, res) => {
  const { rideId, otherUserId } = req.params;

  const unreadMessages = await Message.find({
    ride: rideId,
    sender: otherUserId,
    receiver: req.user._id,
    read: false,
  }).select("_id");

  if (unreadMessages.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: unreadMessages.map((message) => message._id) },
      },
      {
        $set: { read: true },
      }
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${otherUserId}`).emit("messages-read", {
        rideId,
        readBy: req.user._id.toString(),
        messageIds: unreadMessages.map((message) => message._id.toString()),
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { count: unreadMessages.length }, "Conversation marked as read")
  );
});

export { getMessages, markConversationRead };
