import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  await user.save({ validateBeforeSave: false });

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
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User registered successfully"
      )
    );
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
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      refreshToken: { token: incomingRefreshToken },
    },
  });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

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
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken },
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

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      role: "driver",
      "drivingLicense.licenseNumber": licenseNumber,
    },
    { new: true },
  ).select("-password -refreshToken");

  const vehicle = await Vehicle.create({
    owner: user._id,
    brand,
    model,
    year,
    color,
    registrationNumber,
    totalSeats,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user, vehicle }, "Driver profile created"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  setupDriverProfile,
};
