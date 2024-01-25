import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// here when url hit '/register' it transfer the control to 'registerUser'
// with it's define method that is 'post'
router.route("/register").post(
  // we use multer middleware before 'registerUser' for handling multipart/form-data
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// router.route("/login").post(loginUser);

export default router;
