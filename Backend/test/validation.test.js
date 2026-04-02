import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../src/utils/ApiError.js";
import {
  assertFiniteCoordinatePair,
  assertObjectId,
  normalizePaymentMethod,
  parseNonNegativeNumber,
  parsePositiveInteger,
  requirePaymentMethod,
} from "../src/utils/validation.js";

test("normalizePaymentMethod supports Razorpay aliases", () => {
  assert.equal(normalizePaymentMethod("nb"), "netbanking");
  assert.equal(normalizePaymentMethod("upi"), "upi");
  assert.equal(normalizePaymentMethod("cash"), "cash");
  assert.equal(normalizePaymentMethod("crypto"), undefined);
});

test("requirePaymentMethod rejects unknown values", () => {
  assert.throws(() => requirePaymentMethod("crypto"), ApiError);
});

test("parsePositiveInteger accepts numeric strings and rejects fractions", () => {
  assert.equal(parsePositiveInteger("3", "Seats"), 3);
  assert.throws(() => parsePositiveInteger(1.5, "Seats"), ApiError);
  assert.throws(() => parsePositiveInteger(0, "Seats"), ApiError);
});

test("parseNonNegativeNumber rejects negative and non-numeric values", () => {
  assert.equal(parseNonNegativeNumber("25", "Amount"), 25);
  assert.throws(() => parseNonNegativeNumber(-1, "Amount"), ApiError);
  assert.throws(() => parseNonNegativeNumber("abc", "Amount"), ApiError);
});

test("assertObjectId validates Mongo object ids", () => {
  assert.doesNotThrow(() => assertObjectId("507f1f77bcf86cd799439011", "booking ID"));
  assert.throws(() => assertObjectId("bad-id", "booking ID"), ApiError);
});

test("assertFiniteCoordinatePair validates lat/lng pairs", () => {
  assert.doesNotThrow(() => assertFiniteCoordinatePair([78.4, 17.4], "coordinates"));
  assert.throws(() => assertFiniteCoordinatePair([78.4], "coordinates"), ApiError);
  assert.throws(() => assertFiniteCoordinatePair([78.4, Number.NaN], "coordinates"), ApiError);
});
