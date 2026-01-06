// transaction-service/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import auth from "./middleware/auth.js";
import categoryRoutes from "./routes/categories.js";
import transactionRoutes from "./routes/transactions.js";
import reminderRoutes from "./routes/reminders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// BỎ /api Ở ĐÂY
app.use("/categories", auth, categoryRoutes);
app.use("/transactions", auth, transactionRoutes);
app.use("/reminders", auth, reminderRoutes);

app.get("/", (req, res) => {
  res.json({ service: "transaction-service", status: "ok" });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Transaction service running on port ${PORT}`);
  });
};

start();
