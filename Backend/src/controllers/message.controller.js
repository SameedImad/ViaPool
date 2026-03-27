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

export { getMessages };
