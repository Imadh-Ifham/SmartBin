import mongoose from "mongoose";

mongoose.set("strictQuery", true);
mongoose.set("runValidators", true);

const connectDB = async (): Promise<void> => {
  const connectWithRetry = async (retries = 5, delay = 5000): Promise<void> => {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartbin";
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (err: any) {
      console.error(`❌ MongoDB connection error: ${err.message}`);
      if (retries > 0) {
        console.log(`Retrying in ${delay / 1000}s... (${retries} retries left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error("Exceeded MongoDB connection retries. Exiting.");
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
