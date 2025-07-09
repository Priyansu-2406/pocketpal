import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';

const router = express.Router();

// GET current wallet balance
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.uid });

    if (!wallet) {
      wallet = new Wallet({ userId: req.user.uid, balance: 0 });
      await wallet.save();
    }

    res.json({ balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// POST deposit money
router.post('/deposit', verifyFirebaseToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid deposit amount' });
  }

  try {
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.uid },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // Log the transaction
    await WalletTransaction.create({
      userId: req.user.uid,
      type: 'deposit',
      amount,
    });

    res.json({ message: `Deposited ₹${amount}`, balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to deposit money' });
  }
});

// POST withdraw money
router.post('/withdraw', verifyFirebaseToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid withdrawal amount' });
  }

  try {
    const wallet = await Wallet.findOne({ userId: req.user.uid });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    wallet.balance -= amount;
    await wallet.save();

    // Log the transaction
    await WalletTransaction.create({
      userId: req.user.uid,
      type: 'withdraw',
      amount,
    });

    res.json({ message: `Withdrew ₹${amount}`, balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to withdraw money' });
  }
});

// GET transaction history
router.get('/transactions', verifyFirebaseToken, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
