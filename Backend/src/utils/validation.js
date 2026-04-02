import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

const PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet", "cash"];

export const assertObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

export const parsePositiveInteger = (value, label, { min = 1, max } = {}) => {
  const parsed =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;

  if (!Number.isInteger(parsed) || parsed < min || (max != null && parsed > max)) {
    throw new ApiError(400, `${label} must be a whole number`);
  }

  return parsed;
};

export const parseNonNegativeNumber = (value, label) => {
  const parsed =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return parsed;
};

export const normalizePaymentMethod = (paymentMethod) => {
  if (paymentMethod === "nb") return "netbanking";
  if (PAYMENT_METHODS.includes(paymentMethod)) {
    return paymentMethod;
  }

  return undefined;
};

export const requirePaymentMethod = (paymentMethod, label = "payment method") => {
  const normalized = normalizePaymentMethod(paymentMethod);
  if (!normalized) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return normalized;
};

export const assertFiniteCoordinatePair = (coordinates, label) => {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
  ) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};
