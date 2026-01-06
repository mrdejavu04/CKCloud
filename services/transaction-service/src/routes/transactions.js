import express from 'express';
import Category from '../models/Category.js';
import Reminder from '../models/Reminder.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

const normalizeVietnamese = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

router.get('/', async (req, res) => {
  try {
    const { type, categoryId, from, to } = req.query;
    const { page = 1, limit = 15 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 15;
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const query = { userId: uid };

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

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      data: transactions,
      pagination: {
        page,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    let { amount, type, categoryId, categoryName, note, dateTime } = req.body;
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }

    const txDate = dateTime ? new Date(dateTime) : new Date();
    txDate.setSeconds(0, 0);

    let resolvedCategoryName = categoryName;
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, userId: uid });
      if (category) resolvedCategoryName = category.name;
    }

    const transaction = await Transaction.create({
      userId: uid,
      amount,
      type,
      categoryId,
      categoryName: resolvedCategoryName,
      note,
      date: txDate,
    });

    const normalized = normalizeVietnamese(resolvedCategoryName || categoryName || '');
    if (type === 'expense' && normalized === 'hoa don') {
      await Reminder.create({
        userId: uid,
        title: note || 'Hóa đơn',
        amount,
        dueDate: txDate,
        status: 'pending',
      });
    }

    return res.status(201).json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, categoryId, categoryName, note, date } = req.body;
    const updates = {};

    if (amount !== undefined) updates.amount = amount;
    if (type !== undefined) updates.type = type;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (categoryName !== undefined) updates.categoryName = categoryName;
    if (note !== undefined) updates.note = note;
    if (date !== undefined) updates.date = date;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user && req.user.id ? req.user.id : req.userId },
      updates,
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.json({ transaction });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user && req.user.id ? req.user.id : req.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    return res.json({ message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /transactions/amount-suggestions
router.get('/amount-suggestions', async (req, res) => {
  try {
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    let amounts = await Transaction.distinct('amount', { userId: uid });
    amounts = amounts.filter((a) => typeof a === 'number');
    amounts.sort((a, b) => b - a);
    return res.json({ amounts: amounts.slice(0, 20) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
