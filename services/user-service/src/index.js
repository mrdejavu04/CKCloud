import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ service: "user-service", status: "ok" });
});

const start = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected (user-service)");

    app.listen(PORT, () => {
      console.log(`User service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start user-service:", err);
    process.exit(1);
  }
};

start();
