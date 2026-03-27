import { Router } from "express";
import { getDriverEarnings } from "../controllers/earnings.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/driver-history").get(getDriverEarnings);

export default router;
