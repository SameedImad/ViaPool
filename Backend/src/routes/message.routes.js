import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMessages, markConversationRead } from "../controllers/message.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/:rideId/:otherUserId").get(getMessages);
router.route("/:rideId/:otherUserId/read").patch(markConversationRead);

export default router;
