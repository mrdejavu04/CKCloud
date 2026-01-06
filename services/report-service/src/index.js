import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Quan trọng: prefix là /reports (KHÔNG phải /api/reports)
app.use("/reports", reportRoutes);

app.get("/", (req, res) => {
  res.json({ service: "report-service", status: "ok" });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Report service running on port ${PORT}`);
  });
};

start();