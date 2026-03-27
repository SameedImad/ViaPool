import { Payment } from "../models/payment.model.js";
import { Ride } from "../models/ride.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getDriverEarnings = asyncHandler(async (req, res) => {
  // 1. Get all rides belonging to this driver
  const rides = await Ride.find({ driver: req.user._id }).select("_id");
  const rideIds = rides.map(r => r._id);

  // 2. Get all bookings for these rides
  const bookings = await Booking.find({ ride: { $in: rideIds } }).select("_id");
  const bookingIds = bookings.map(b => b._id);

  // 3. Get all successful payments for these bookings
  const payments = await Payment.find({
    booking: { $in: bookingIds },
    paymentStatus: "success"
  }).populate({
    path: 'booking',
    populate: { path: 'ride', select: 'from to departureTime status' }
  });

  const transactions = payments.map(p => ({
    id: p._id,
    date: new Date(p.paidAt || p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    from: `${p.booking?.ride?.from?.address?.split(',')[0]} → ${p.booking?.ride?.to?.address?.split(',')[0]}`,
    passengers: p.booking?.seatsBooked || 1,
    amount: p.amount,
    status: 'paid' // Since we filtered by 'success'
  }));

  // Handle pending earnings (bookings marked as 'confirmed' or 'paid' but payment entry not processed yet?)
  // Actually, for carpooling, 'pending' could be rides completed but not yet settled.
  // For simplicity, let's just return the successful transactions for now.

  return res.status(200).json(
    new ApiResponse(200, transactions, "Earnings fetched")
  );
});

export { getDriverEarnings };
