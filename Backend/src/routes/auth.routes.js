import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, logoutUser, getCurrentUser, setupDriverProfile, refreshAccessToken, updateProfile, deactivateUser, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../utils/s3.service.js";

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
router.route("/forgot-password").post(authLimiter, forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/update-profile").patch(verifyJWT, updateProfile);
router.route("/deactivate").patch(verifyJWT, deactivateUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/setup-driver").post(
    verifyJWT, 
    upload.fields([
        { name: "licenseImage", maxCount: 1 },
        { name: "vehiclePhoto", maxCount: 1 }
    ]),
    setupDriverProfile
);

export default router;
