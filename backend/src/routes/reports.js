import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const { from, to } = req.query;
    const matchStage = { userId };

    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

    const summary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const byCategory = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'expense' } },
      {
        $group: {
          _id: '$categoryName',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: { $ifNull: ['$_id', 'Uncategorized'] },
          total: 1,
        },
      },
    ]);

    const totals = summary.reduce(
      (acc, item) => {
        if (item._id === 'income') acc.totalIncome = item.total;
        if (item._id === 'expense') acc.totalExpense = item.total;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    const balance = totals.totalIncome - totals.totalExpense;

    return res.json({
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      balance,
      byCategory,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalExpense: { $sum: '$amount' },
        },
      },
    ]);

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = monthlyData.find((item) => item._id === month);
      return {
        month,
        totalExpense: found ? found.totalExpense : 0,
      };
    });

    return res.json({ year, monthly });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const byCategory = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: '$categoryName',
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: { $ifNull: ['$_id', 'Uncategorized'] },
          total: 1,
        },
      },
    ]);

    return res.json({ year, month, byCategory });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
