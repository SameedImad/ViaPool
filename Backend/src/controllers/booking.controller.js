import { Booking } from "../models/booking.model.js";
import { Ride } from "../models/ride.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const bookRide = asyncHandler(async (req, res) => {
    const { rideId, seatsBooked, pickupPoint, dropPoint } = req.body;

    if (!rideId || !seatsBooked) {
        throw new ApiError(400, "Ride ID and seats booked are required");
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
        throw new ApiError(404, "Ride not found");
    }

    if (ride.driver.toString() === req.user._id.toString()) {
        throw new ApiError(400, "Driver cannot book their own ride");
    }

    if (ride.availableSeats < seatsBooked) {
        throw new ApiError(400, "Not enough available seats");
    }

    const existingBooking = await Booking.findOne({ ride: rideId, passenger: req.user._id, bookingStatus: { $in: ["pending", "confirmed"] } });
    if (existingBooking) {
        throw new ApiError(400, "You already have an active booking for this ride");
    }

    const totalPrice = ride.pricePerSeat * seatsBooked;

    const booking = await Booking.create({
        ride: rideId,
        passenger: req.user._id,
        seatsBooked,
        totalPrice,
        pickupPoint,
        dropPoint,
        bookingStatus: "pending" // driver will need to confirm or auto-confirm
    });

    // Reduce available seats temporarily (or permanently if auto-confirm)
    ride.availableSeats -= seatsBooked;
    await ride.save({ validateBeforeSave: false });

    return res.status(201).json(new ApiResponse(201, booking, "Ride requested successfully"));
});

const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ passenger: req.user._id })
        .populate("ride", "from to departureTime status")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
});

const getRidePassengers = asyncHandler(async (req, res) => {
    const { rideId } = req.params;

    const ride = await Ride.findOne({ _id: rideId, driver: req.user._id });
    if (!ride) {
        throw new ApiError(403, "You do not have permission to view passengers for this ride");
    }

    const bookings = await Booking.find({ ride: rideId })
        .populate("passenger", "firstName lastName profilePhoto phone");

    return res.status(200).json(new ApiResponse(200, bookings, "Passengers fetched successfully"));
});

const cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, passenger: req.user._id });
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (booking.bookingStatus === "cancelled") {
        throw new ApiError(400, "Booking is already cancelled");
    }

    booking.bookingStatus = "cancelled";
    await booking.save({ validateBeforeSave: false });

    const ride = await Ride.findById(booking.ride);
    if (ride) {
        ride.availableSeats += booking.seatsBooked;
        await ride.save({ validateBeforeSave: false });
    }

    return res.status(200).json(new ApiResponse(200, {}, "Booking cancelled successfully"));
});

export {
    bookRide,
    getMyBookings,
    getRidePassengers,
    cancelBooking
};
