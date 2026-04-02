import { Ride } from "../models/ride.model.js";
import { SOS } from "../models/sos.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/notification.service.js";

const triggerSOS = asyncHandler(async (req, res) => {
  const { rideId, lat, lng, message } = req.body;

  if (!rideId || typeof lat !== "number" || typeof lng !== "number") {
    throw new ApiError(400, "Ride ID and numeric coordinates are required for SOS");
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

  if (req.user.emergencyContact?.email) {
    await sendEmail({
      to: req.user.emergencyContact.email,
      subject: "Emergency SOS Alert - ViaPool",
      text: `EMERGENCY ALERT: ${req.user.firstName} has triggered SOS on ViaPool ride ${rideId}. Location: https://maps.google.com/?q=${lat},${lng}`,
      html: `<div style="padding:20px; border:2px solid #C4622D; border-radius:12px; font-family:sans-serif;">
               <h2 style="color:#C4622D;">Emergency SOS Triggered</h2>
               <p>User <strong>${req.user.firstName} ${req.user.lastName}</strong> is in distress on a ViaPool ride.</p>
               <p><strong>Ride ID:</strong> ${rideId}</p>
               <p><strong>Location:</strong> <a href="https://maps.google.com/?q=${lat},${lng}">View on Google Maps</a></p>
             </div>`,
    });
  }

  const io = req.app.get("io");
  if (io) {
    io.emit("admin-sos-alert", {
      sosId: sos._id,
      rideId,
      user: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        phone: req.user.phone,
      },
      location: { lat, lng },
      message: sos.message,
    });
  }

  return res.status(201).json(
    new ApiResponse(201, sos, "SOS alert triggered and authorities notified"),
  );
});

const resolveSOS = asyncHandler(async (req, res) => {
  const { sosId } = req.params;
  const { status } = req.body;

  if (!["resolved", "false_alarm"].includes(status)) {
    throw new ApiError(400, "Invalid resolution status");
  }

  const sos = await SOS.findByIdAndUpdate(sosId, { status }, { new: true });

  if (!sos) {
    throw new ApiError(404, "SOS record not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, sos, `SOS resolved as ${status}`));
});

export { triggerSOS, resolveSOS };
