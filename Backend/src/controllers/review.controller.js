import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getReviewsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const reviews = await Review.find({ reviewedUser: userId })
    .populate("reviewer", "firstName lastName profilePhoto")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, reviews, "Reviews fetched successfully")
  );
});

const createReview = asyncHandler(async (req, res) => {
  const { rideId, reviewedUserId, rating, comment } = req.body;

  if (!rideId || !reviewedUserId || !rating) {
    throw new ApiError(400, "Ride ID, Reviewed User ID, and Rating are required");
  }

  const review = await Review.create({
    ride: rideId,
    reviewer: req.user._id,
    reviewedUser: reviewedUserId,
    rating,
    comment
  });

  // Optional: Update user overall rating (could also use a post-save hook in model)
  const user = await User.findById(reviewedUserId);
  if (user) {
    const totalRatingSum = (user.overallRating * user.totalRatings) + rating;
    user.totalRatings += 1;
    user.overallRating = totalRatingSum / user.totalRatings;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(201).json(
    new ApiResponse(201, review, "Review created successfully")
  );
});

export { getReviewsForUser, createReview };
