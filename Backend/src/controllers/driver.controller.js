import { Ride } from "../models/ride.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMyEarnings = asyncHandler(async (req, res) => {
  const rides = await Ride.find({ driver: req.user._id }).select("_id departureTime from to status");
  const rideIds = rides.map(r => r._id);

  const bookings = await Booking.find({
    ride: { $in: rideIds },
    status: { $in: ["confirmed", "completed", "active"] }
  }).populate("ride", "from to departureTime status");

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let total = 0;
  let pending = 0;
  const transactions = [];

  const currentMonthIdx = new Date().getMonth();
  const monthlyData = [0, 0, 0, 0, 0, 0];
  const displayMonths = [];

  for (let i = 5; i >= 0; i--) {
    let m = currentMonthIdx - i;
    if (m < 0) m += 12; // Wrap around for previous year
    displayMonths.push(MONTHS[m]);
  }

  bookings.forEach(b => {
    const amt = b.totalPrice || 0;

    // If the ride is not completed, we consider the payout pending
    const isPending = b.ride?.status !== "completed";

    if (isPending) pending += amt;
    else total += amt;

    const fromName = b.ride?.from?.address?.split(',')[0] || "Unknown";
    const toName = b.ride?.to?.address?.split(',')[0] || "Unknown";

    transactions.push({
      id: b._id,
      date: new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
      from: `${fromName} → ${toName}`,
      passengers: b.seatsBooked,
      amount: amt,
      status: isPending ? "pending" : "paid",
      rawDate: new Date(b.createdAt)
    });

    const bMonth = new Date(b.createdAt).getMonth();
    const monthLabel = MONTHS[bMonth];
    const idx = displayMonths.indexOf(monthLabel);
    if (idx !== -1) {
      monthlyData[idx] += amt;
    }
  });

  transactions.sort((a, b) => b.rawDate - a.rawDate);

  res.status(200).json(new ApiResponse(200, {
    total,
    pending,
    transactions,
    monthlyAmounts: monthlyData,
    monthlyLabels: displayMonths
  }, "Earnings fetched"));
});

export { getMyEarnings };
