// server/app.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import goalRoutes from './routes/goalRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import splitRoutes from './routes/splitRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';



dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/goals', goalRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/splits', splitRoutes);
app.use('/api/payment', paymentRoutes);



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

export default app;
