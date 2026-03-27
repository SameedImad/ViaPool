import { Router } from "express";
import { getPublicProfile } from "../controllers/user.controller.js";

const router = Router();

router.route("/:userId").get(getPublicProfile);
router.route("/:userId/verify").patch(verifyJWT, updateVerificationStatus);

export default router;
