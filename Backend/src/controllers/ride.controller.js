import mongoose from "mongoose";
import { Ride } from "../models/ride.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ---------------------- HELPERS ---------------------- */

const validateLocation = (location, fieldName) => {
    if (
        !location ||
        typeof location.address !== "string" ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        typeof location.coordinates[0] !== "number" ||
        typeof location.coordinates[1] !== "number"
    ) {
        throw new ApiError(400, `Invalid ${fieldName} location structure`);
    }
};

/* ---------------------- CREATE RIDE ---------------------- */

const createRide = asyncHandler(async (req, res) => {
    const { from, to, departureTime, pricePerSeat, preferences, vehicleId } = req.body;

    if (!from || !to || !departureTime || !pricePerSeat || !vehicleId) {
        throw new ApiError(400, "All ride details are required");
    }

    if (req.user.role !== "driver") {
        throw new ApiError(403, "Only drivers can create rides");
    }

    validateLocation(from, "from");
    validateLocation(to, "to");

    const departureDate = new Date(departureTime);

    if (isNaN(departureDate.getTime())) {
        throw new ApiError(400, "Invalid departure time");
    }

    // Allow slight clock drift (5 seconds)
    const now = new Date();
    const graceWindow = 5000;

    if (departureDate.getTime() < now.getTime() - graceWindow) {
        throw new ApiError(400, "Departure time cannot be in the past");
    }

    if (typeof pricePerSeat !== "number" || pricePerSeat < 0) {
        throw new ApiError(400, "Invalid price per seat");
    }

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        throw new ApiError(400, "Invalid vehicle ID");
    }

    const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        owner: req.user._id
    });

    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found or does not belong to the user");
    }

    const totalSeats = vehicle.totalSeats;
    const availableSeats = vehicle.totalSeats - 1;

    if (availableSeats <= 0) {
        throw new ApiError(400, "Vehicle must have at least 2 seats");
    }

    const ride = await Ride.create({
        driver: req.user._id,
        vehicle: vehicle._id,
        from,
        to,
        departureTime: departureDate,
        pricePerSeat,
        totalSeats,
        availableSeats,
        preferences
    });

    return res
        .status(201)
        .json(new ApiResponse(201, ride, "Ride created successfully"));
});

/* ---------------------- SEARCH RIDES ---------------------- */

const searchRides = asyncHandler(async (req, res) => {
    const { fromLat, fromLng, minSeats, page = 1, limit = 10 } = req.query;

    if (!fromLat || !fromLng) {
        throw new ApiError(400, "Starting coordinates are required");
    }

    const latitude = parseFloat(fromLat);
    const longitude = parseFloat(fromLng);
    const seatsRequired = parseInt(minSeats) || 1;

    if (isNaN(latitude) || isNaN(longitude)) {
        throw new ApiError(400, "Invalid coordinates");
    }

    const currentPage = parseInt(page);
    const perPage = parseInt(limit);

    const skip = (currentPage - 1) * perPage;

    const rides = await Ride.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                distanceField: "distanceFromUser",
                spherical: true,
                maxDistance: 50000 // 50km radius
            }
        },
        {
            $match: {
                status: "scheduled",
                departureTime: { $gte: new Date() },
                availableSeats: { $gte: seatsRequired }
            }
        },
        { $sort: { departureTime: 1 } },
        { $skip: skip },
        { $limit: perPage }
    ]);

    const populatedRides = await Ride.populate(rides, [
        {
            path: "driver",
            select: "firstName lastName profilePhoto overallRating totalRatings"
        },
        {
            path: "vehicle",
            select: "brand model color registrationNumber"
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, populatedRides, "Rides fetched successfully"));
});

/* ---------------------- GET RIDE DETAILS ---------------------- */

const getRideDetails = asyncHandler(async (req, res) => {
    const { rideId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rideId)) {
        throw new ApiError(400, "Invalid ride ID");
    }

    const ride = await Ride.findById(rideId)
        .populate("driver", "firstName lastName profilePhoto overallRating totalRatings phone")
        .populate("vehicle", "brand model color registrationNumber");

    if (!ride) {
        throw new ApiError(404, "Ride not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, ride, "Ride details fetched successfully"));
});

export {
    createRide,
    searchRides,
    getRideDetails
};