import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMyEarnings } from "../controllers/driver.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/earnings").get(getMyEarnings);

export default router;
