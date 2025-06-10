// utils/s3.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "ap-south-1", // Your bucket region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadFileToS3 = async (file, folder) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const key = `${folder}/${fileName}`;

  const params = {
    Bucket: "lms-app1", // Your S3 bucket name
    Key: key,
    Body: file.buffer, // From multer memoryStorage
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `https://lms-app1.s3.ap-south-1.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};