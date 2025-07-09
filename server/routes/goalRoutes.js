import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import Goal from '../models/Goal.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';

const router = express.Router();

// GET all goals for logged-in user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST create a new goal
router.post('/', verifyFirebaseToken, async (req, res) => {
  const { title, targetAmount } = req.body;

  if (!title || !targetAmount) {
    return res.status(400).json({ error: 'Title and targetAmount are required' });
  }

  try {
    const goal = new Goal({
      userId: req.user.uid,
      title,
      targetAmount,
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT update a goal saved amount
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const { savedAmount } = req.body;

  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.uid },
      { savedAmount },
      { new: true }
    );

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE a goal and transfer funds back to wallet
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;

  try {
    // 1) Find the goal
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // 2) Fetch wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // 3) Calculate new wallet balance
    const newBalance = wallet.balance + goal.savedAmount;

    // 4) Prepare parallel operations
    const updateWalletPromise = Wallet.updateOne(
      { userId },
      { $set: { balance: newBalance } }
    );

    const addTransactionPromise = new WalletTransaction({
      userId,
      amount: goal.savedAmount,
      type: 'transfer',
      timestamp: new Date(),
      description: `Transferred from goal: ${goal.title}`,
    }).save();

    const deleteGoalPromise = Goal.deleteOne({ _id: id, userId });

    // 5) Run all in parallel for speed
    await Promise.all([updateWalletPromise, addTransactionPromise, deleteGoalPromise]);

    res.json({ message: 'Goal deleted and funds transferred successfully.' });
  } catch (error) {
    console.error('Error deleting goal and transferring funds:', error);
    res.status(500).json({ error: 'Failed to delete goal and transfer funds.' });
  }
});

export default router;
