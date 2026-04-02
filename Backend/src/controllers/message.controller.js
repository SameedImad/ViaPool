import { Message } from "../models/message.model.js";
import { Booking } from "../models/booking.model.js";
import { Ride } from "../models/ride.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const assertConversationAccess = async (rideId, currentUserId, otherUserId) => {
  const ride = await Ride.findById(rideId).select("driver");

  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const rideDriverId = ride.driver.toString();
  const currentId = currentUserId.toString();
  const otherId = otherUserId.toString();

  const [currentBooking, otherBooking] = await Promise.all([
    Booking.findOne({
      ride: rideId,
      passenger: currentUserId,
      bookingStatus: { $in: ["confirmed", "completed"] },
    }).select("_id"),
    Booking.findOne({
      ride: rideId,
      passenger: otherUserId,
      bookingStatus: { $in: ["confirmed", "completed"] },
    }).select("_id"),
  ]);

  const currentIsDriver = rideDriverId === currentId;
  const otherIsDriver = rideDriverId === otherId;
  const currentIsPassenger = Boolean(currentBooking);
  const otherIsPassenger = Boolean(otherBooking);

  if (
    !(
      (currentIsDriver && otherIsPassenger) ||
      (otherIsDriver && currentIsPassenger)
    )
  ) {
    throw new ApiError(403, "You do not have access to this conversation");
  }
};

const getMessages = asyncHandler(async (req, res) => {
  const { rideId, otherUserId } = req.params;

  await assertConversationAccess(rideId, req.user._id, otherUserId);

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

  await assertConversationAccess(rideId, req.user._id, otherUserId);

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
