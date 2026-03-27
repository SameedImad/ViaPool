import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      required: true,
    },

    firstName: {
      type: String,
      trim: true,
      required: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
      required: true,
    },

    profilePhoto: String,

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["passenger", "driver"],
      default: "passenger",
    },

    refreshToken: [
      {
        token: String,
        createdAt: Date,
      },
    ],

    drivingLicense: {
      licenseNumber: {
        type: String,
        uppercase: true,
        trim: true,
      },
      licenseImage: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    overallRating: {
      type: Number,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    emergencyContact: {
      name: String,
      phone: String,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      isBlocked: this.isBlocked,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
