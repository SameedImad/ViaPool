import { Ride } from "../models/ride.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";
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

    if (!from || !to || !departureTime || !pricePerSeat) {
        throw new ApiError(400, "All ride details except vehicleId are required");
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

    let vehicle;
    if (vehicleId) {
        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
            throw new ApiError(400, "Invalid vehicle ID");
        }
        vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });
    } else {
        vehicle = await Vehicle.findOne({ owner: req.user._id });
    }

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
    const { fromLat, fromLng, fromAddress, toAddress, date, minSeats, page = 1, limit = 10 } = req.query;

    const seatsRequired = parseInt(minSeats) || 1;
    const currentPage = parseInt(page);
    const perPage = parseInt(limit);
    const skip = (currentPage - 1) * perPage;

    let query = {
        status: "scheduled",
        availableSeats: { $gte: seatsRequired }
    };

    // Date filtering (match the full day)
    if (date) {
        const searchDate = new Date(date);
        const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
        query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
        query.departureTime = { $gte: new Date() };
    }

    // Address filtering
    if (fromAddress) {
        query["from.address"] = { $regex: fromAddress, $options: "i" };
    }
    if (toAddress) {
        query["to.address"] = { $regex: toAddress, $options: "i" };
    }

    let pipeline = [];

    // Use geoNear if coordinates are provided, otherwise just match
    if (fromLat && fromLng) {
        const latitude = parseFloat(fromLat);
        const longitude = parseFloat(fromLng);
        pipeline.push({
            $geoNear: {
                near: { type: "Point", coordinates: [longitude, latitude] },
                distanceField: "distanceFromUser",
                spherical: true,
                maxDistance: 50000 // 50km
            }
        });
        pipeline.push({ $match: query });
    } else {
        pipeline.push({ $match: query });
        pipeline.push({ $addFields: { distanceFromUser: 0 } }); // Dummy field for consistency
    }

    pipeline.push({ $sort: { departureTime: 1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: perPage });

    const rides = await Ride.aggregate(pipeline);

    const populatedRides = await Ride.populate(rides, [
        {
            path: "driver",
            select: "firstName lastName profilePhoto overallRating totalRatings bio tagline isVerified"
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
        .populate("driver", "firstName lastName profilePhoto overallRating totalRatings phone bio tagline")
        .populate("vehicle", "brand model color registrationNumber");

    if (!ride) {
        throw new ApiError(404, "Ride not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, ride, "Ride details fetched successfully"));
});

/* ---------------------- UPDATE RIDE STATUS ---------------------- */

const updateRideStatus = asyncHandler(async (req, res) => {
    const { rideId } = req.params;
    const { status } = req.body;

    if (!["ongoing", "completed", "cancelled"].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const ride = await Ride.findOne({ _id: rideId, driver: req.user._id });

    if (!ride) {
        throw new ApiError(404, "Ride not found or unauthorized");
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
        throw new ApiError(400, "Cannot update status of a completed or cancelled ride");
    }

    ride.status = status;
    await ride.save({ validateBeforeSave: false });

    // Broadcast status update to all passengers in the ride room
    const io = req.app.get("io");
    if (io) {
        io.to(`ride_${rideId}`).emit("ride-status-update", { rideId, status });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, ride, `Ride status updated to ${status}`));
});

/* ---------------------- GET DRIVER DASHBOARD ---------------------- */

const getDriverDashboard = asyncHandler(async (req, res) => {
    if (req.user.role !== "driver") {
        throw new ApiError(403, "Only drivers can access the driver dashboard");
    }

    const driverId = req.user._id;

    // 1. Upcoming Rides (Top 3 scheduled or ongoing)
    const upcomingRides = await Ride.find({
        driver: driverId,
        status: { $in: ["scheduled", "ongoing"] },
        departureTime: { $gte: new Date(Date.now() - 3600000) } // Allow rides from 1 hour ago
    })
    .sort({ departureTime: 1 })
    .limit(5)
    .populate("vehicle", "brand model");

    // Get passenger counts for these rides
    const ridesWithCounts = await Promise.all(upcomingRides.map(async (r) => {
        const confirmedBookings = await Booking.find({ ride: r._id, bookingStatus: "confirmed" });
        const passengersCount = confirmedBookings.reduce((sum, b) => sum + b.seatsBooked, 0);
        return {
            ...r.toObject(),
            passengersCount
        };
    }));

    // 2. Statistics
    const activeRidesCount = await Ride.countDocuments({
        driver: driverId,
        status: { $in: ["scheduled", "ongoing"] }
    });

    const totalRidesCount = await Ride.countDocuments({
        driver: driverId,
        status: "completed"
    });

    // 3. Weekly Earnings (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyBookings = await Booking.find({
        status: "confirmed", // or "completed" if you only want paid out
        createdAt: { $gte: sevenDaysAgo }
    }).populate({
        path: "ride",
        match: { driver: driverId }
    });

    // Filter out bookings where ride didn't match the driver
    const driverWeeklyBookings = weeklyBookings.filter(b => b.ride);

    const weeklyTotal = driverWeeklyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Prepare chart data (Last 7 days)
    const chartData = [];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = DAYS[d.getDay()];
        
        // Sum earnings for this specific day
        const dayStart = new Date(d.setHours(0,0,0,0));
        const dayEnd = new Date(d.setHours(23,59,59,999));
        
        const dayEarnings = driverWeeklyBookings
            .filter(b => {
                const bDate = new Date(b.createdAt);
                return bDate >= dayStart && bDate <= dayEnd;
            })
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        chartData.push({
            day: dayName,
            amt: dayEarnings,
            h: weeklyTotal > 0 ? `${Math.max(5, (dayEarnings / weeklyTotal) * 100)}%` : "5%"
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {
            upcomingRides: ridesWithCounts,
            stats: {
                weeklyEarnings: weeklyTotal,
                activeRides: activeRidesCount,
                avgRating: req.user.overallRating || 0,
                totalRides: totalRidesCount,
                acceptanceRate: "95%" // Static for now as per plan
            },
            weeklyChart: chartData
        }, "Driver dashboard data fetched"));
});

export {
    createRide,
    searchRides,
    getRideDetails,
    updateRideStatus,
    markPassengerPickedUp,
    getDriverDashboard
};