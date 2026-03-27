import { Router } from "express";
import { getPublicProfile } from "../controllers/user.controller.js";

const router = Router();

router.route("/:userId").get(getPublicProfile);

export default router;
