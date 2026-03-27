import { Router } from "express";
import { createRide, searchRides, getRideDetails, updateRideStatus, markPassengerPickedUp, getDriverDashboard } from "../controllers/ride.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// secured routes
router.use(verifyJWT);

router.route("/create").post(createRide);
router.route("/driver/dashboard").get(getDriverDashboard);
router.route("/search").get(searchRides);
router.route("/:rideId").get(getRideDetails);
router.route("/:rideId/status").patch(updateRideStatus);
router.route("/:rideId/booking/:bookingId/pickup").patch(markPassengerPickedUp);

export default router;
