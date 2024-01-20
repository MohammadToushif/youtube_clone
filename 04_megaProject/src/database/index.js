import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`
    ); // console.log(connectionInstance) to get more knowladge
  } catch (error) {
    console.log("MongoDB Connection Failed", error);
    process.exit(1); // learn about it
  }
};

export default connectDB;