import express from 'express';
import Reminder from '../models/Reminder.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/summary', async (req, res) => {
  try {
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const pending = await Reminder.find({
      userId: uid,
      status: 'pending',
    })
      .sort({ dueDate: 1 })
      .limit(5);

    const pendingInvoices = pending.length;
    const pendingList = pending.map((r) => ({
      id: r._id,
      title: r.title,
      amount: r.amount,
      dueDate: r.dueDate,
      status: r.status,
    }));

    return res.json({ pendingInvoices, pendingList });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const uid = req.user && req.user.id ? req.user.id : req.userId;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });
    const filter = { userId: uid };

    const [reminders, total] = await Promise.all([
      Reminder.find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Reminder.countDocuments(filter),
    ]);

    const today = new Date();
    const upcomingThreshold = new Date();
    upcomingThreshold.setDate(today.getDate() + 3);

    const formatted = reminders.map((reminder) => {
      const reminderObj = reminder.toObject();
      let statusLabel = 'pending';

      if (reminder.status === 'paid') {
        statusLabel = 'paid';
      } else if (reminder.dueDate < today) {
        statusLabel = 'overdue';
      } else if (reminder.dueDate <= upcomingThreshold) {
        statusLabel = 'upcoming';
      }

      return { ...reminderObj, statusLabel };
    });

    return res.json({
      data: formatted,
      pagination: {
        page: pageNum,
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
    const { title, amount, dueDate } = req.body;
    if (!title || !amount || !dueDate) {
      return res.status(400).json({ message: 'Title, amount, and due date are required' });
    }

    const reminder = await Reminder.create({
      userId: req.user && req.user.id ? req.user.id : req.userId,
      title,
      amount,
      dueDate,
      status: 'pending',
    });

    return res.status(201).json({ reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, dueDate, status } = req.body;
    const reminder = await Reminder.findOne({ _id: id, userId: req.user && req.user.id ? req.user.id : req.userId });
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    const prevStatus = reminder.status;
    if (title !== undefined) reminder.title = title;
    if (amount !== undefined) reminder.amount = amount;
    if (dueDate !== undefined) reminder.dueDate = dueDate;
    if (status !== undefined) reminder.status = status;

    await reminder.save();

    if (prevStatus !== 'paid' && reminder.status === 'paid') {
      const txDate = reminder.dueDate ? new Date(reminder.dueDate) : new Date();
      txDate.setSeconds(0, 0);
      await Transaction.create({
        userId: req.user && req.user.id ? req.user.id : req.userId,
        amount: reminder.amount,
        type: 'expense',
        categoryName: 'Hóa đơn',
        note: reminder.title,
        date: txDate,
      });
    }

    return res.json({ reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
