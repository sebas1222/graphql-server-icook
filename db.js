import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

mongoose
  .connect(process.env.MONGODB_ATLAS_URI)
  .then(() => {
    console.log("connected");
  })
  .catch((error) => {
    console.log(error);
  });
