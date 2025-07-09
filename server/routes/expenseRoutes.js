import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import Expense from '../models/Expense.js';

const router = express.Router();

// GET all expenses for the logged-in user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST add a new expense
router.post('/', verifyFirebaseToken, async (req, res) => {
  const { amount, category, note } = req.body;
  if (!amount || !category) {
    return res.status(400).json({ error: 'Amount and category are required' });
  }

  try {
    const expense = new Expense({
      userId: req.user.uid,
      amount,
      category,
      note,
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// DELETE an expense by ID
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Expense.deleteOne({ _id: id, userId: req.user.uid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
