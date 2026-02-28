import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import authRouter from './routes/auth.routes.js';
import rideRouter from './routes/ride.routes.js';
import bookingRouter from './routes/booking.routes.js';
import paymentRouter from './routes/payment.routes.js';
import mapRouter from './routes/map.routes.js';

// routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/rides", rideRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/maps", mapRouter);

export { app }
