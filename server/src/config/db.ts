import mongoose from "mongoose";

mongoose.set("strictQuery", true);
mongoose.set("runValidators", true);

const connectDB = async (): Promise<void> => {
  const connectWithRetry = async (retries = 5, delay = 5000): Promise<void> => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI as string);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err: any) {
      console.error(`❌ MongoDB connection error: ${err.message}`);
      if (retries > 0) {
        console.log(
          `Retrying in ${delay / 1000}s... (${retries} retries left)`
        );
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        process.exit(1);
      }
    }
  };

  await connectWithRetry();

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected!");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB reconnected");
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
  });
};

export default connectDB;
