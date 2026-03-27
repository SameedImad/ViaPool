import mongoose, { Schema } from "mongoose";

const vehicleSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      min: 1990,
      max: new Date().getFullYear(),
    },

    color: {
      type: String,
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 2,
      max: 7, // typical car range
    },

    documents: {
      rcImage: {
        type: String, // URL
      },
      insuranceImage: {
        type: String, // URL
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
