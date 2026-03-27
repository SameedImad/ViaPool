import { Router } from "express";
import { triggerSOS, resolveSOS } from "../controllers/sos.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/trigger").post(triggerSOS);
router.route("/:sosId/resolve").patch(resolveSOS);

export default router;
