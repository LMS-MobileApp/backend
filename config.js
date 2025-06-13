import dotenv from "dotenv";


dotenv.config({ path: "../backend/.env" });


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




      // project root eke  .env file ekak hadala meka daganna

// # Server
// PORT=5001
// MONGO_URI=mongodb://localhost:27017/lms-app
// JWT_SECRET=1a4b8f3fd3d91a7ec26be25903879b0153797cc951ea8f789fef311e65e47f3b

// # AWS S3 Configuration
// AWS_REGION=ap-south-1
// AWS_ACCESS_KEY_ID=AKIAVY2PG4ZRKZ4BN7GO
// AWS_SECRET_ACCESS_KEY=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
// AWS_BUCKET_NAME=lms-app1

// # Email Configuration
// EMAIL_USER=d1611841@gmail.com
// EMAIL_PASS=cvvg lcgl wijx frie
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587

// # OpenAI GPT
// GPT_TOKEN=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
// GPT_ENDPOINT=https://models.inference.ai.azure.com
// GPT_MODEL=gpt-4o