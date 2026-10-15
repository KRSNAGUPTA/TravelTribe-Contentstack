import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri =
      process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI_PROD
        : process.env.MONGO_URI;

    if (!uri) {
      console.error("MongoDB URI is not set in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;