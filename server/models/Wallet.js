import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // one wallet per user
  balance: { type: Number, default: 0 },
});

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;
