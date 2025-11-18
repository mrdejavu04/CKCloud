import express from 'express';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { type, categoryId, from, to } = req.query;
    const query = { userId: req.userId };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    return res.json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, type, categoryId, categoryName, note, date } = req.body;
    if (!amount || !type || !date) {
      return res.status(400).json({ message: 'Amount, type, and date are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }

    let resolvedCategoryName = categoryName;
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, userId: req.userId });
      if (category) {
        resolvedCategoryName = category.name;
      }
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      amount,
      type,
      categoryId,
      categoryName: resolvedCategoryName,
      note,
      date,
    });

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create transaction', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update transaction', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json({ message: 'Transaction deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
});

export default router;
