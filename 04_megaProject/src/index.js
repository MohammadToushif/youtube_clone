// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./database/index.js";
import app from "./app.js";

// 2nd approch to connect database
dotenv.config({
  path: "./env",
});

// Note: whenever async function is called, it returns a promise
// that's why we handle it with .then() and .catch() method
connectDB()
  .then(() => {
    // listening error after connecting database
    app.on("error", (error) => {
      console.log(`Error : ${error}`);
    });

    // listening app after connecting database
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Your server is started on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MondoDB connection failed!", error);
  });

/*
// 1st approch to connect database

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

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
