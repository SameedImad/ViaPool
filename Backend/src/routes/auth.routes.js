import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, logoutUser, getCurrentUser, setupDriverProfile, refreshAccessToken } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
    message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes",
        errors: []
    }
});

router.route("/register").post(authLimiter, registerUser);
router.route("/login").post(authLimiter, loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/setup-driver").post(verifyJWT, setupDriverProfile);

export default router;
