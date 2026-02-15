import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    ride: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },

    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reviewedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate review for same ride between same users
reviewSchema.index(
  { ride: 1, reviewer: 1, reviewedUser: 1 },
  { unique: true }
);

export const Review = mongoose.model("Review", reviewSchema);
