import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, setupDriverProfile, refreshAccessToken } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/setup-driver").post(verifyJWT, setupDriverProfile);

export default router;
