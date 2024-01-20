// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./database/index.js";

// Second approch to connect database
dotenv.config({
  path: "./env",
});

connectDB();










/*
// First approch to connect database

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express";

const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("Error while connecting to the database: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();

*/
