import cloudinary from "cloudinary";
import * as dotenv from "dotenv";
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Upload
export const uploadImage = async (filePath) => {
  return await cloudinary.UploadStream.upload(
    (filePath,
    {
      folder: "icook",
    })
  );
};
