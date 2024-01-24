import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

// here when url hit with '/register' it transfer the control to 'registerUser'
// with it's define method that is 'post'
router.route("/register").post(registerUser);
// router.route("/login").post(loginUser);


export default router;