import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getReviewsForUser, createReview } from "../controllers/review.controller.js";

const router = Router();

router.route("/user/:userId").get(getReviewsForUser);

router.use(verifyJWT);
router.route("/").post(createReview);

export default router;
