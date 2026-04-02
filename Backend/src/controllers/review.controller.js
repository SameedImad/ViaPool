import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import { Ride } from "../models/ride.model.js";
import { Booking } from "../models/booking.model.js";
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

  if (req.user._id.toString() === reviewedUserId.toString()) {
    throw new ApiError(400, "You cannot review yourself");
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const ride = await Ride.findById(rideId).select("driver status");
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  if (ride.status !== "completed") {
    throw new ApiError(400, "Reviews can only be submitted for completed rides");
  }

  const isDriverReviewer = ride.driver.toString() === req.user._id.toString();
  const reviewerBooking = await Booking.findOne({
    ride: rideId,
    passenger: req.user._id,
    bookingStatus: { $in: ["confirmed", "completed"] },
  }).select("_id passenger");

  if (!isDriverReviewer && !reviewerBooking) {
    throw new ApiError(403, "Only ride participants can leave a review");
  }

  if (isDriverReviewer) {
    const reviewedPassengerBooking = await Booking.findOne({
      ride: rideId,
      passenger: reviewedUserId,
      bookingStatus: { $in: ["confirmed", "completed"] },
    }).select("_id");

    if (!reviewedPassengerBooking) {
      throw new ApiError(400, "Drivers can only review passengers from this ride");
    }
  } else if (ride.driver.toString() !== reviewedUserId.toString()) {
    throw new ApiError(400, "Passengers can only review the driver for this ride");
  }

  let review;
  try {
    review = await Review.create({
      ride: rideId,
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      rating,
      comment,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You have already reviewed this user for the ride");
    }

    throw error;
  }

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
