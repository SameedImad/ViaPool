import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "booking_request",
        "booking_confirmed",
        "booking_cancelled",
        "payment_success",
        "payment_failed",
        "ride_cancelled",
        "new_message",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    relatedId: {
      type: Schema.Types.ObjectId,
      // can reference Ride, Booking, or Message
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize fetching latest notifications
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model(
  "Notification",
  notificationSchema
);
