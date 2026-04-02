import { Router } from "express";
import { triggerSOS, resolveSOS } from "../controllers/sos.controller.js";
import { requireAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/trigger").post(triggerSOS);
router.route("/:sosId/resolve").patch(requireAdmin, resolveSOS);

export default router;
