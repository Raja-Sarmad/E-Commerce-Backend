import cloudinaryModule from "cloudinary";
const cloudinary = cloudinaryModule.v2;
import config from "./index.js";

if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  console.warn(
    "[cloudinary] Missing credentials — image uploads will be unavailable until CLOUDINARY_* env vars are set."
  );
}

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export default cloudinary;
