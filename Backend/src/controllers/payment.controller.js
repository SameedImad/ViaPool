import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const initializeRazorpay = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const createOrder = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, passenger: req.user._id });

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (booking.paymentStatus === "paid") {
        throw new ApiError(400, "Booking is already paid");
    }

    const instance = initializeRazorpay();

    const options = {
        amount: booking.totalPrice * 100, // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_order_${booking._id}`,
    };

    const order = await instance.orders.create(options);

    if (!order) {
        throw new ApiError(500, "Error creating Razorpay order");
    }

    res.status(200).json(new ApiResponse(200, order, "Order created successfully"));
});

const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        throw new ApiError(400, "Invalid payment signature");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    // Save payment record
    await Payment.create({
        booking: bookingId,
        payer: req.user._id,
        amount: booking.totalPrice,
        transactionId: razorpay_payment_id,
        paymentStatus: "success",
        paymentMethod: "online",
        paidAt: Date.now()
    });

    // Update booking status
    booking.paymentStatus = "paid";
    await booking.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, { verified: true }, "Payment verified successfully"));
});

export {
    createOrder,
    verifyPayment
};
