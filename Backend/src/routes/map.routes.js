import { Router } from "express";
import { autocompleteAddress, getDistanceAndDuration } from "../controllers/map.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/autocomplete").get(autocompleteAddress);
router.route("/distance").get(getDistanceAndDuration);

export default router;
