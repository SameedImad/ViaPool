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
    status: 'paid'
  }));

  // Aggregations
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const pending = 0; // For future escrow/settlement logic

  // 6-month chart data
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = MONTHS[d.getMonth()];
      const monthYear = d.getFullYear();
      
      const monthStart = new Date(monthYear, d.getMonth(), 1);
      const monthEnd = new Date(monthYear, d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthEarnings = payments
          .filter(p => {
              const pDate = new Date(p.paidAt || p.createdAt);
              return pDate >= monthStart && pDate <= monthEnd;
          })
          .reduce((s, p) => s + p.amount, 0);

      chartData.push({ month: monthName, amt: monthEarnings });
  }

  return res.status(200).json(
    new ApiResponse(200, {
        transactions,
        total,
        pending,
        chartData
    }, "Earnings fetched")
  );
});

export { getDriverEarnings };
