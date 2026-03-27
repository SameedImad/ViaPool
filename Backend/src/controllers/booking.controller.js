import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Ride } from "../models/ride.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ---------------------- HELPERS ---------------------- */

const validatePoint = (point) => {
  if (!point) return;

  if (
    !Array.isArray(point.coordinates) ||
    point.coordinates.length !== 2 ||
    typeof point.coordinates[0] !== "number" ||
    typeof point.coordinates[1] !== "number"
  ) {
    throw new ApiError(400, "Invalid pickup/drop coordinates");
  }
};

/* ---------------------- BOOK RIDE ---------------------- */

const bookRide = asyncHandler(async (req, res) => {
  const { rideId, seatsBooked, pickupPoint, dropPoint } = req.body;

  if (!rideId || !seatsBooked) {
    throw new ApiError(400, "Ride ID and seats booked are required");
  }

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    throw new ApiError(400, "Invalid ride ID");
  }

  if (seatsBooked <= 0) {
    throw new ApiError(400, "Seats booked must be at least 1");
  }

  validatePoint(pickupPoint);
  validatePoint(dropPoint);

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  if (["completed", "cancelled"].includes(ride.status)) {
    throw new ApiError(400, "Ride is not available for booking");
  }

  if (ride.driver.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Driver cannot book their own ride");
  }

  if (seatsBooked > ride.totalSeats) {
    throw new ApiError(400, "Invalid seat request");
  }

  const existingBooking = await Booking.findOne({
    ride: rideId,
    passenger: req.user._id,
    bookingStatus: { $ne: "cancelled" },
  });

  if (existingBooking) {
    throw new ApiError(400, "You already have a booking for this ride");
  }

  /*
  Atomic seat reservation
  Prevents race conditions
  */
  const updatedRide = await Ride.findOneAndUpdate(
    {
      _id: rideId,
      availableSeats: { $gte: seatsBooked },
    },
    {
      $inc: { availableSeats: -seatsBooked },
    },
    { new: true }
  );

  if (!updatedRide) {
    throw new ApiError(400, "Not enough available seats");
  }

  const totalPrice = updatedRide.pricePerSeat * seatsBooked;

  const booking = await Booking.create({
    ride: rideId,
    passenger: req.user._id,
    seatsBooked,
    totalPrice,
    pickupPoint,
    dropPoint,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, booking, "Ride booked successfully"));
});

/* ---------------------- MY BOOKINGS ---------------------- */

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ passenger: req.user._id })
    .populate({
      path: "ride",
      select: "from to departureTime status pricePerSeat driver",
      populate: {
        path: "driver",
        select: "firstName lastName phone"
      }
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
});

/* ---------------------- RIDE PASSENGERS ---------------------- */

const getRidePassengers = asyncHandler(async (req, res) => {
  const { rideId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    throw new ApiError(400, "Invalid ride ID");
  }

  const ride = await Ride.findOne({
    _id: rideId,
    driver: req.user._id,
  });

  if (!ride) {
    throw new ApiError(
      403,
      "You do not have permission to view passengers for this ride"
    );
  }

  const bookings = await Booking.find({
    ride: rideId,
    bookingStatus: { $ne: "cancelled" },
  }).populate(
    "passenger",
    "firstName lastName profilePhoto phone overallRating"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Passengers fetched successfully"));
});

/* ---------------------- CANCEL BOOKING ---------------------- */

const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    passenger: req.user._id,
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.bookingStatus === "cancelled") {
    throw new ApiError(400, "Booking already cancelled");
  }

  if (booking.bookingStatus === "completed") {
    throw new ApiError(400, "Completed bookings cannot be cancelled");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    booking.bookingStatus = "cancelled";
    await booking.save({ validateBeforeSave: false, session });

    await Ride.findByIdAndUpdate(booking.ride, {
      $inc: { availableSeats: booking.seatsBooked },
    }, { session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Booking cancelled successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export {
  bookRide,
  getMyBookings,
  getRidePassengers,
  cancelBooking,
};