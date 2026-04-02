import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName : process.env.DB_NAME
        })
        logger.info("MongoDB connected successfully");
    } catch (error) {
        logger.error("MongoDB connection failed", error);
        process.exit(1);
    }
}
