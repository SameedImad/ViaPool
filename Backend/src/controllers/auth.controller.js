import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if ([email, password, firstName].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Email, password and first name are required")
    }

    const existedUser = await User.findOne({ $or: [{ email }, { phone }] })
    if (existedUser) {
        throw new ApiError(409, "User with email or phone already exists")
    }

    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role: role || "passenger"
    })

    const createdUser = await User.findById(user._id).select("-password")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const setupDriverProfile = asyncHandler(async (req, res) => {
    const { licenseNumber, brand, model, year, color, registrationNumber, totalSeats } = req.body;

    if (!licenseNumber || !brand || !model || !registrationNumber || !totalSeats) {
        throw new ApiError(400, "Missing required driver/vehicle details");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                role: "driver",
                "drivingLicense.licenseNumber": licenseNumber
            }
        },
        { new: true }
    ).select("-password")

    const vehicle = await Vehicle.create({
        owner: user._id,
        brand,
        model,
        year,
        color,
        registrationNumber,
        totalSeats
    });

    return res.status(200).json(new ApiResponse(200, { user, vehicle }, "Driver profile created successfully"));
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    setupDriverProfile
}
