import { User } from "../models/user.model.js";
import { Ride } from "../models/ride.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getPublicProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("firstName lastName role profilePhoto overallRating totalRatings bio tagline createdAt");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Count trips (rides for driver, bookings for passenger)
  let tripsCount = 0;
  if (user.role === "driver") {
    tripsCount = await Ride.countDocuments({ driver: userId, status: "completed" });
  } else {
    // This would need booking model import if we want to count passenger trips
    // For now, let's just stick to driver trips or a simple count
  }

  return res.status(200).json(
    new ApiResponse(200, { ...user.toObject(), tripsCount }, "Public profile fetched")
  );
});

export { getPublicProfile };
