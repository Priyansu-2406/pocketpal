import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Firebase UID
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
