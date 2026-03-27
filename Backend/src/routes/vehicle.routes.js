import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getVehicles,
  addVehicle,
  deleteVehicle,
  setPrimaryVehicle,
} from "../controllers/vehicle.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getVehicles).post(addVehicle);
router.route("/:id").delete(deleteVehicle);
router.route("/:id/primary").patch(setPrimaryVehicle);

export default router;
