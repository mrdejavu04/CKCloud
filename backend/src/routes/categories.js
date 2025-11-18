import express from 'express';
import Category from '../models/Category.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Name and valid type are required' });
    }

    const category = await Category.create({ userId: req.userId, name, type });
    return res.status(201).json({ category });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
});

export default router;
