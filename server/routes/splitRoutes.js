import express from 'express';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import Split from '../models/Split.js';

const router = express.Router();

// GET all splits
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const splits = await Split.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json(splits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch splits' });
  }
});

// POST create a new split
router.post('/', verifyFirebaseToken, async (req, res) => {
  const { amount, numPeople, category, perPersonDetails } = req.body;
  if (!amount || !numPeople || !category || !perPersonDetails || !perPersonDetails.length) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const split = new Split({
      userId: req.user.uid,
      amount,
      numPeople,
      category,
      perPersonDetails,
    });
    await split.save();
    res.status(201).json(split);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create split' });
  }
});

// PUT update settlement
router.put('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  const { personIndex, settleAll } = req.body;

  try {
    const split = await Split.findOne({ _id: id, userId: req.user.uid });
    if (!split) return res.status(404).json({ error: 'Split not found' });

    if (settleAll) {
      split.perPersonDetails.forEach(p => p.settled = true);
    } else if (personIndex !== undefined && personIndex >= 0 && personIndex < split.perPersonDetails.length) {
      split.perPersonDetails[personIndex].settled = true;
    }

    split.settled = split.perPersonDetails.every(p => p.settled);
    await split.save();
    res.json(split);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update split' });
  }
});

// DELETE a split
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Split.deleteOne({ _id: id, userId: req.user.uid });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Split not found' });
    res.json({ message: 'Split deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete split' });
  }
});

export default router;
