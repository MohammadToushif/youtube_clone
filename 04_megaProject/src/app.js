import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// .use() is used for middleware and configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// configuration setting for middleware

// handle incoming requests with JSON payloads
app.use(express.json({ limit: "16kb" }));

// handle incoming requests with url
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// to store some public assets such as (file, folder, pdf etc)
// this assets can be accessable for any user
app.use("/public", express.static("public"));

// to perform CURD operation on the user's browser cookie from the server
app.use(cookieParser());

// It's called file sagrigation
// routes import
import userRouter from "./routes/user.routes.js";

// routes declearation
// since we seperate route from the app, that's why we use middleware to get router
// here when user hit on '/api/v1/users' it transfer the control to 'userRouter'
app.use("/api/v1/users", userRouter);

// http://localhost:8000/users/register
// http://localhost:8000/users/login

export default app;
