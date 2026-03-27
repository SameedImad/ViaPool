import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken.push({
    token: refreshToken,
    createdAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  if (!email || !password || !firstName) {
    throw new ApiError(400, "Email, password and first name are required");
  }

  const normalizedEmail = email.toLowerCase();

  const query = [{ email: normalizedEmail }];

  if (phone) {
    query.push({ phone });
  }

  const existedUser = await User.findOne({ $or: query });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    phone,
    role: role || "passenger",
  });

  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(404, "User does not exist");

  if (user.isBlocked) {
    throw new ApiError(403, "Account is blocked");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token required");
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      refreshToken: { token: incomingRefreshToken },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decoded?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const tokenExists = user.refreshToken.some(
    (t) => t.token === incomingRefreshToken,
  );

  if (!tokenExists) {
    throw new ApiError(401, "Refresh token not recognized");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access token refreshed successfully",
      ),
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched"));
});

const setupDriverProfile = asyncHandler(async (req, res) => {
  const {
    licenseNumber,
    brand,
    model,
    year,
    color,
    registrationNumber,
    totalSeats,
  } = req.body;

  if (
    !licenseNumber ||
    !brand ||
    !model ||
    !registrationNumber ||
    !totalSeats
  ) {
    throw new ApiError(400, "Missing required fields");
  }

  const existingVehicle = await Vehicle.findOne({ registrationNumber });
  if (existingVehicle) {
    throw new ApiError(409, "Vehicle already registered");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: "driver",
        "drivingLicense.licenseNumber": licenseNumber,
      },
      { new: true, session },
    ).select("-password -refreshToken");

    const vehicleResult = await Vehicle.create(
      [
        {
          owner: user._id,
          brand,
          model,
          year,
          color,
          registrationNumber,
          totalSeats,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, vehicle: vehicleResult[0] },
          "Driver profile created",
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, bio, tagline, email, privacy } = req.body;

  const updateFields = { firstName, lastName, phone, bio, tagline, email };
  if (privacy) {
    updateFields.privacy = { ...req.user.privacy, ...privacy };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields,
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, user, "Profile updated successfully")
  );
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { isDeactivated: true },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(200, {}, "Account deactivated successfully")
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  setupDriverProfile,
  updateProfile,
  deactivateUser
};
