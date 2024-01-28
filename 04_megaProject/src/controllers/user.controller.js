import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// const registerUser = asyncHandler(async (req, res) => {
//   res.status(200).json({
//     message: "ok",
//   });
// });

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, userName, email, password } = req.body;
  // console.table([fullName, userName, email, password]);

  // add validation : fields are not empty

  // if (fullName === "") {
  //   throw new ApiError(400, "Fullname is required");
  // }

  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  // check if user already exist : by 'username/email'
  const userExist = await User.findOne({ $or: [{ userName }, { email }] });
  if (userExist) {
    throw new ApiError(409, "username or email already exists");
  }

  // check images are available at local-path : avatar is required
  // here we get '.files' access from multer
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // create an user object : create entry in db
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // check whether the user is created or not and
  // remove password and refresh token field form response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw ApiError(500, "Something went wrong while registering the user");
  }

  // return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

// function to generate access and refresh tokens
const generateAccess_RefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // store generated user's refreshToken in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
    // returned accessToken, refreshToken to loginUser
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong!, unable to generate access & refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  // get data from request body : userName, email, password
  const { userName, email, password } = req.body;
  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required!");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  // check userName/email is exist
  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  // check password
  const resPassword = await user.checkPassword(password);
  if (!resPassword) {
    throw new ApiError(401, "Wrong password, try again!");
  }

  // generate access and refresh token
  const { accessToken, refreshToken } = await generateAccess_RefreshTokens(
    user._id
  );

  // send the tokens to the user through cookie
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  // send response of successfully login
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged-In Successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: undefined,
      // },
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged-out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get user refresh token
  const userRefreshToken =
    req.cookies.refreshAccessToken || req.body.refreshToken;
  if (!userRefreshToken) {
    throw new ApiError(401, "Refresh token is required!");
  }

  try {
    // extract the id from decoded refresh token
    const decodedRefreshToken = jwt.verify(
      userRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // find the user by that id
    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    // check if the user's tokens have expired
    // if (Date.now() > user.tokensExpiration.refreshTokenExpires) {
    if (userRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token has expired or used");
    }

    // regenerate access and refresh token
    const { accessToken, refreshToken } = await generateAccess_RefreshTokens(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    // send respose to the user
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  //  get data from body
  const { currPassword, newPassword } = req.body;

  // get user
  const user = await User.findById(req.user?._id);
  const isPasswordMatch = await user.checkPassword(currPassword);

  if (!isPasswordMatch) {
    throw new ApiError(400, "Incorrect password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "User fetched successfully!");
});

const updateUserAccount = asyncHandler(async (req, res) => {
  const { fullName, userName, email } = req.body;
  if (!(fullName || userName || email)) {
    throw new ApiError(400, "All fields is required!");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      fullName: fullName,
      userName: userName,
      email: email,
    },
    { new: true } // it return updated user info
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully!"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar is updated successfully!"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover-image file is missing!");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading cover-image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover-image is updated successfully!"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // Here we use mongoDB aggregatation pipleline to channel subscriber & subscriptions
  const channel = await User.aggregate([
    {
      // stage 1 : find user
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      // stage 2 : user(channel) subscribers
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "channelSubscribers",
      },
    },
    {
      // stage 3 : channels(users) that user subscribed
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "userSubcriptions",
      },
    },
    {
      //  stage 4 : add new fields in user data-model
      $addFields: {
        subscribersCount: {
          $size: "$channelSubscribers.isActive",
        },
        subcriptionsCount: {
          $size: "$userSubcriries",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$channelSubscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // stage 5 : sending output in array's objects
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subcriptionsCount: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Channel fetched successfully!"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    // first pipline 1:
    {
      // aggregate pipleline code directly goes to DB, and it is not passes
      // through mongoose, that's why we have to make mongoose object id
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // this pipeline is optional only for frontend developer help
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      200,
      ApiResponse(
        200,
        user[0].watchHistory,
        "Watch-History fetch successfully!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserAccount,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
