import { Router } from "express";
import { createRide, searchRides, getRideDetails } from "../controllers/ride.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// secured routes
router.use(verifyJWT);

router.route("/create").post(createRide);
router.route("/search").get(searchRides);
router.route("/:rideId").get(getRideDetails);

export default router;
