import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    ride: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },

    passenger: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    pickupPoint: {
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    dropPoint: {
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent same user booking same ride twice (optional but recommended)
bookingSchema.index({ ride: 1, passenger: 1 }, { unique: true });

export const Booking = mongoose.model("Booking", bookingSchema);
