import AWS from "aws-sdk";
import { config } from "../config.js";

// Log AWS config
console.log("AWS Config:", {
  region: config.AWS_REGION,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  bucket: config.AWS_BUCKET_NAME,
});

const s3 = new AWS.S3({
  region: config.AWS_REGION,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
});

const uploadToS3 = async (file, folder) => {
  try {
    console.log("Uploading file:", file.originalname, "to folder:", folder);
    const params = {
      Bucket: config.AWS_BUCKET_NAME,
      Key: `${folder}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read", // Ensures files are publicly accessible
    };
    console.log("S3 Upload Params:", {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      ACL: params.ACL,
    });

    const result = await s3.upload(params).promise();
    console.log("S3 Upload Result:", result);
    return result;
  } catch (err) {
    console.error("S3 Upload Error:", err);
    throw err;
  }
};

const getFileUrl = (key) => {
  const url = `https://${config.AWS_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
  console.log("Generated S3 URL:", url);
  return url;
};

export { uploadToS3, getFileUrl };