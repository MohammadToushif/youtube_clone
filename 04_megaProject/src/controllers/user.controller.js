import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
  console.log(resPassword);
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
      $set: {
        refreshToken: undefined,
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

export { registerUser, loginUser, logoutUser };
