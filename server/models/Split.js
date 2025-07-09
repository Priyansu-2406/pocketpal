import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  settled: { type: Boolean, default: false },
});

const splitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  numPeople: { type: Number, required: true },
  category: { type: String, required: true },
  perPersonDetails: [personSchema],
  settled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Split = mongoose.model('Split', splitSchema);

export default Split;
