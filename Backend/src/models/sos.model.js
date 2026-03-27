import mongoose, { Schema } from "mongoose";

const sosSchema = new Schema(
  {
    ride: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "resolved", "false_alarm"],
      default: "active",
    },
    message: String,
  },
  {
    timestamps: true,
  }
);

sosSchema.index({ location: "2dsphere" });

export const SOS = mongoose.model("SOS", sosSchema);
