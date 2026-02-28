import { Ride } from "../models/ride.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createRide = asyncHandler(async (req, res) => {
    const { from, to, departureTime, pricePerSeat, totalSeats, preferences, vehicleId } = req.body;

    if (!from || !to || !departureTime || !pricePerSeat || !totalSeats || !vehicleId) {
        throw new ApiError(400, "All ride details are required");
    }

    if (req.user.role !== "driver") {
        throw new ApiError(403, "Only drivers can create rides");
    }

    // Verify Vehicle belongs to driver
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) {
        throw new ApiError(404, "Vehicle not found or does not belong to the user");
    }

    const availableSeats = totalSeats - 1;

    const ride = await Ride.create({
        driver: req.user._id,
        vehicle: vehicleId,
        from,
        to,
        departureTime,
        pricePerSeat,
        totalSeats,
        availableSeats,
        preferences
    });

    return res.status(201).json(new ApiResponse(201, ride, "Ride created successfully"));
});

const searchRides = asyncHandler(async (req, res) => {
    const { fromLat, fromLng, toLat, toLng, minSeats } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
        throw new ApiError(400, "From and To coordinates are required for searching");
    }

    // Basic geospatial query implementation using $near or simple bounding box.
    // Assuming simple exact match for MVP or $geoWithin if coordinates are properly indexed (2dsphere).
    // For now, returning all scheduled rides filtering by basic criteria.
    const query = { status: "scheduled", availableSeats: { $gte: parseInt(minSeats) || 1 } };

    // TODO: Implement actual geospatial filtering with MongoDB $geoNear or $near

    const rides = await Ride.find(query)
        .populate("driver", "firstName lastName profilePhoto overallRating totalRatings")
        .populate("vehicle", "brand model color registrationNumber");

    return res.status(200).json(new ApiResponse(200, rides, "Rides fetched successfully"));
});

const getRideDetails = asyncHandler(async (req, res) => {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
        .populate("driver", "firstName lastName profilePhoto overallRating totalRatings phone")
        .populate("vehicle", "brand model color registrationNumber");

    if (!ride) {
        throw new ApiError(404, "Ride not found");
    }

    return res.status(200).json(new ApiResponse(200, ride, "Ride details fetched successfully"));
});

export {
    createRide,
    searchRides,
    getRideDetails
};
