import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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

export { registerUser };
