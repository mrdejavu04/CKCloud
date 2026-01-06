import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
// KHÔNG dùng express.json ở gateway
app.use(morgan("dev"));

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";
const TX_SERVICE_URL = process.env.TX_SERVICE_URL || "http://transaction-service:5002";
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || "http://report-service:5003";

// Auth
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "" }, // /api/auth -> /auth
  })
);

// Transactions
app.use(
  ["/api/categories", "/api/transactions", "/api/reminders"],
  createProxyMiddleware({
    target: TX_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "" }, // /api/... -> /...
  })
);

// Reports  ❗
app.use(
  "/api/reports",
  createProxyMiddleware({
    target: REPORT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "" }, // /api/reports/... -> /reports/...
  })
);

app.get("/", (req, res) => {
  res.json({ message: "API Gateway OK" });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});