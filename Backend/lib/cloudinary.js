import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
	console.error("⚠️  Cloudinary configuration missing!");
	console.error("Please set the following environment variables in your .env file:");
	console.error("  CLOUDINARY_CLOUD_NAME=your_cloud_name");
	console.error("  CLOUDINARY_API_KEY=your_api_key");
	console.error("  CLOUDINARY_API_SECRET=your_api_secret");
	console.error("\nGet your credentials from: https://console.cloudinary.com/");
}

cloudinary.config({
	cloud_name: cloudName,
	api_key: apiKey,
	api_secret: apiSecret,
});

export default cloudinary;
