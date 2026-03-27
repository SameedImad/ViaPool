import { SOS } from "../models/sos.model.js";
import { Ride } from "../models/ride.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const triggerSOS = asyncHandler(async (req, res) => {
  const { rideId, lat, lng, message } = req.body;

  if (!rideId || !lat || !lng) {
    throw new ApiError(400, "Ride ID and coordinates are required for SOS");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const sos = await SOS.create({
    ride: rideId,
    user: req.user._id,
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },
    message: message || "Emergency SOS triggered",
  });

  // Broadcast SOS to admin and relevant parties via socket
  const io = req.app.get("io");
  if (io) {
    io.emit("admin-sos-alert", {
      sosId: sos._id,
      rideId,
      user: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        phone: req.user.phone
      },
      location: { lat, lng },
      message: sos.message
    });
  }

  return res.status(201).json(
    new ApiResponse(201, sos, "SOS alert triggered and authorities notified")
  );
});

const resolveSOS = asyncHandler(async (req, res) => {
  const { sosId } = req.params;
  const { status } = req.body;

  if (!["resolved", "false_alarm"].includes(status)) {
    throw new ApiError(400, "Invalid resolution status");
  }

  const sos = await SOS.findByIdAndUpdate(
    sosId,
    { status },
    { new: true }
  );

  if (!sos) {
    throw new ApiError(404, "SOS record not found");
  }

  return res.status(200).json(
    new ApiResponse(200, sos, `SOS resolved as ${status}`)
  );
});

export { triggerSOS, resolveSOS };
