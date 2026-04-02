import { Router } from "express";
import { bookRide, getMyBookings, getRidePassengers, cancelBooking } from "../controllers/booking.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/book").post(bookRide);
router.route("/my-bookings").get(getMyBookings);
router.route("/:rideId/passengers").get(getRidePassengers); // Driver only check done in controller
router.route("/:bookingId/cancel").post(cancelBooking).patch(cancelBooking);

export default router;
