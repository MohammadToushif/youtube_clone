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

// to get, set or perform CURD operation on the browser cookie of the user from the server
app.use(cookieParser())

export default app;
