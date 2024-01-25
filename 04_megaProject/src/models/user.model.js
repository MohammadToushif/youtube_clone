import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Fullname is required"],
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      // Here 'index' help us to make the field searchable
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String, // cloudinary url
      required: [true, "Avatar image is required"],
    },
    coverImage: {
      type: String, //cloudinary url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Here we use 'mongoose' 'pre' hook as a middleware
/* since arrow function don't have the access of 'this', that's why we use our classic function because we need the context of 'userSchema'. */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = bcrypt.hash(this.password, salt);
  next();
});

// Here we create our custom methods form 'new mongoose.Schema()' .methods
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// function to generate access token
userSchema.methods.generateAccessToken = function () {
  // 'jwt.sign()' method help us to generate tokens
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// funciton to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  // 'jwt.sign()' method help us to generate tokens
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
