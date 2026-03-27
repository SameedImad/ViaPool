import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Access Token");
  }

  const user = await User.findById(decoded?._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "User is blocked");
  }

  req.user = user;
  next();
});