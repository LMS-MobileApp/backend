import dotenv from "dotenv";


dotenv.config({ path: "../lms-backend/.env" });


export const config = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  
  // Log for debugging
  console.log("Config loaded:", config);
  

  if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials are missing");
  }
  if (!config.EMAIL_USER || !config.EMAIL_PASS) {
    console.warn("Email credentials are missing. Email functionality will fail.");
  }
  if (!config.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }