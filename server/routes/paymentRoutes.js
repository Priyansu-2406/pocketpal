import express from 'express';
import razorpay from '../razorpay.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', verifyFirebaseToken, async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  const userId = req.user.uid;

  try {
    const options = {
      amount: amount * 100, // amount in paise (e.g., ₹500 = 50000 paise)
      currency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

export default router;
