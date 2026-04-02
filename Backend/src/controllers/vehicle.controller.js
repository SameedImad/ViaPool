import { Vehicle } from "../models/vehicle.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ensureDriver = (user) => {
  if (user?.role !== "driver" && user?.role !== "admin") {
    throw new ApiError(403, "Only drivers can manage vehicles");
  }
};

const getVehicles = asyncHandler(async (req, res) => {
  ensureDriver(req.user);
  const vehicles = await Vehicle.find({ owner: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, vehicles, "Vehicles fetched"));
});

const addVehicle = asyncHandler(async (req, res) => {
  ensureDriver(req.user);
  let { make: brand, model, year, color, registrationNumber, type, plate } = req.body;

  // Frontend sometimes sends 'plate' instead of registrationNumber
  if (plate) registrationNumber = plate;

  if (!brand || !model || !registrationNumber || !type) {
    throw new ApiError(400, "Brand, model, type, and registration number are required");
  }

  const existingVehicle = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
  if (existingVehicle) {
    throw new ApiError(409, "Vehicle already registered");
  }

  let totalSeats = 4;
  if(type === "SUV" || type === "MUV") totalSeats = 7;

  const vehicleCount = await Vehicle.countDocuments({ owner: req.user._id });

  const vehicle = await Vehicle.create({
    owner: req.user._id,
    brand,
    model,
    year: year || new Date().getFullYear(),
    color: color || "Unknown",
    registrationNumber: registrationNumber.toUpperCase(),
    totalSeats,
    isDefault: vehicleCount === 0
  });

  return res.status(201).json(new ApiResponse(201, vehicle, "Vehicle added"));
});

const deleteVehicle = asyncHandler(async (req, res) => {
  ensureDriver(req.user);
  const { id } = req.params;
  const vehicle = await Vehicle.findOneAndDelete({ _id: id, owner: req.user._id });

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found or already removed");
  }

  if (vehicle.isDefault) {
     const remaining = await Vehicle.findOne({ owner: req.user._id });
     if(remaining) {
        remaining.isDefault = true;
        await remaining.save();
     }
  }

  return res.status(200).json(new ApiResponse(200, {}, "Vehicle deleted"));
});

const setPrimaryVehicle = asyncHandler(async (req, res) => {
  ensureDriver(req.user);
  const { id } = req.params;
  const vehicle = await Vehicle.findOne({ _id: id, owner: req.user._id });
  
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  await Vehicle.updateMany({ owner: req.user._id }, { isDefault: false });
  vehicle.isDefault = true;
  await vehicle.save();

  return res.status(200).json(new ApiResponse(200, vehicle, "Primary vehicle updated"));
});

export { getVehicles, addVehicle, deleteVehicle, setPrimaryVehicle };
