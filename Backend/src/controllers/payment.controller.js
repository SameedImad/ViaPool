import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { Booking } from "../models/booking.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const initializeRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new ApiError(500, "Razorpay is not configured on the server");
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const normalizePaymentMethod = (paymentMethod) => {
    if (paymentMethod === "nb") return "netbanking";
    if (["upi", "card", "netbanking", "wallet", "cash"].includes(paymentMethod)) {
        return paymentMethod;
    }

    return undefined;
};

const createOrder = asyncHandler(async (req, res) => {
    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, passenger: req.user._id });

    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    if (booking.bookingStatus === "cancelled") {
        throw new ApiError(400, "Cancelled bookings cannot be paid");
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

    await Payment.findOneAndUpdate(
        { booking: booking._id },
        {
            payer: req.user._id,
            amount: booking.totalPrice,
            currency: "INR",
            paymentStatus: "pending",
            paymentMethod: normalizePaymentMethod(paymentMethod),
            providerOrderId: order.id,
            providerSignature: undefined,
            transactionId: undefined,
            paidAt: undefined,
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        },
    );

    res.status(200).json(
        new ApiResponse(
            200,
            {
                ...order,
                keyId: process.env.RAZORPAY_KEY_ID
            },
            "Order created successfully"
        )
    );
});

const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingId,
        paymentMethod,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
        throw new ApiError(400, "Incomplete payment verification payload");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
        throw new ApiError(400, "Invalid payment signature");
    }

    const booking = await Booking.findOne({ _id: bookingId, passenger: req.user._id });
    if (!booking) {
        throw new ApiError(404, "Booking not found");
    }

    const payment = await Payment.findOne({ booking: bookingId, payer: req.user._id });
    if (!payment) {
        throw new ApiError(400, "Payment order was not initialized for this booking");
    }

    if (payment.providerOrderId !== razorpay_order_id) {
        throw new ApiError(400, "Payment order does not match this booking");
    }

    if (payment.amount !== booking.totalPrice) {
        throw new ApiError(400, "Payment amount mismatch");
    }

    payment.transactionId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    payment.paymentStatus = "success";
    payment.paymentMethod = normalizePaymentMethod(paymentMethod) || payment.paymentMethod;
    payment.paidAt = new Date();
    await payment.save();

    booking.paymentStatus = "paid";
    await booking.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                verified: true,
                paymentId: payment.transactionId,
            },
            "Payment verified successfully",
        ),
    );
});

export {
    createOrder,
    verifyPayment
};
