import express from 'express';
import Reminder from '../models/Reminder.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.userId }).sort({ dueDate: 1 });
    return res.json({ reminders });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reminders', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, amount, dueDate, status } = req.body;
    if (!title || !amount || !dueDate) {
      return res.status(400).json({ message: 'Title, amount, and due date are required' });
    }

    const reminder = await Reminder.create({
      userId: req.userId,
      title,
      amount,
      dueDate,
      status,
    });

    return res.status(201).json({ reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create reminder', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    return res.json({ reminder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update reminder', error: error.message });
  }
});

export default router;
