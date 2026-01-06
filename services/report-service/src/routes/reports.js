import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Transaction from "../models/Transaction.js"; // dùng chung schema với transaction-service

const router = express.Router();

/**
 * GET /reports/summary
 * Tổng thu, chi, số dư của user hiện tại
 */
router.get("/summary", auth, async (req, res) => {
  try {
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new mongoose.Types.ObjectId(uid);
    const { from, to } = req.query;
    const matchStage = { userId };

    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

    const [agg, byCategory] = await Promise.all([
      Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$type", // "income" hoặc "expense"
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { ...matchStage, type: "expense" } },
        {
          $group: {
            _id: "$categoryName",
            total: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            categoryName: { $ifNull: ["$_id", "Uncategorized"] },
            total: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    agg.forEach((row) => {
      if (row._id === "income") totalIncome = row.total;
      if (row._id === "expense") totalExpense = row.total;
    });

    const balance = totalIncome - totalExpense;

    return res.json({
      totalIncome,
      totalExpense,
      balance,
      byCategory,
    });
  } catch (err) {
    console.error("Error in /reports/summary:", err);
    return res.status(500).json({ message: "Error generating summary" });
  }
});

/**
 * GET /reports/by-category?year=2025&month=12
 * Chi tiêu theo danh mục trong 1 tháng (hoặc tháng hiện tại nếu thiếu param)
 */
router.get("/by-category", auth, async (req, res) => {
  try {
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const userId = new mongoose.Types.ObjectId(uid);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const byCategory = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$categoryName",
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: { $ifNull: ["$_id", "Uncategorized"] },
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.json({ year, month, byCategory });
  } catch (err) {
    console.error("Error in /reports/by-category:", err);
    return res.status(500).json({ message: "Error generating category report" });
  }
});

/**
 * GET /reports/by_year?year=2025&month=12
 * Chi tiêu theo danh mục trong 1 tháng (hoặc cả năm nếu không có month)
 */
router.get("/by_year", auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!year) {
      return res.status(400).json({ message: "year is required" });
    }

    const yearNum = Number(year);
    const monthNum = month ? Number(month) : undefined;

    if (Number.isNaN(yearNum) || (month && Number.isNaN(monthNum))) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    const userId = new mongoose.Types.ObjectId(uid);

    const start = new Date(yearNum, monthNum ? monthNum - 1 : 0, 1);
    const end = new Date(
      monthNum ? yearNum : yearNum + 1,
      monthNum ? monthNum : 0,
      1
    );

    const agg = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$categoryName",
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: { $ifNull: ["$_id", "Uncategorized"] },
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.json({ year: yearNum, month: monthNum, byCategory: agg });
  } catch (err) {
    console.error("Error in /reports/by_year:", err);
    return res.status(500).json({ message: "Error generating yearly report" });
  }
});

export default router;
