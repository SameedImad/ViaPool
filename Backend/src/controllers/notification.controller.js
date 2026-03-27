import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(
    new ApiResponse(200, notifications, "Notifications fetched")
  );
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  return res.status(200).json(
    new ApiResponse(200, {}, "All notifications marked as read")
  );
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount: count }, "Unread count fetched")
  );
});

export {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount
};
