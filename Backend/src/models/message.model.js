import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    ride: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize fetching chat of a ride sorted by time
messageSchema.index({ ride: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
