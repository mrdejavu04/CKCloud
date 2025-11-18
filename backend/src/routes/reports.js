import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const summary = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const byCategory = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$categoryName',
          total: { $sum: '$amount' },
        },
      },
      { $project: { _id: 0, categoryName: '$_id', total: 1 } },
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
    return res.status(500).json({ message: 'Failed to build summary', error: error.message });
  }
});

export default router;
