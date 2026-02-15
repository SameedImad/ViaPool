import mongoose, { Schema } from "mongoose";

const locationSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new Schema(
  {
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    from: {
      type: locationSchema,
      required: true,
    },

    to: {
      type: locationSchema,
      required: true,
    },

    departureTime: {
      type: Date,
      required: true,
    },

    arrivalTime: {
      type: Date,
    },

    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },

    rideNotes: {
      type: String,
      trim: true,
    },

    stops: [
      {
        address: String,
        coordinates: [Number],
      },
    ],
  },
  {
    timestamps: true,
  }
);

/*
  IMPORTANT:
  When creating a ride:

  totalSeats = vehicle.totalSeats
  availableSeats = vehicle.totalSeats - 1
*/

export const Ride = mongoose.model("Ride", rideSchema);
