import React, { useState } from 'react';
import { auth } from '../firebase';

function AddExpense({ onExpenseAdded }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) {
      alert('Please enter both amount and category.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      alert('Not logged in');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          note,
        }),
      });

      if (!res.ok) throw new Error('Failed to add expense.');
      await res.json();

      setAmount('');
      setCategory('');
      setNote('');
      onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8 w-full">
      <h3 className="text-xl font-bold mb-4 text-gray-700">Add New Expense</h3>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="number"
          placeholder="Amount..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/3"
        >
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Shopping">Shopping</option>
          <option value="Utilities">Utilities</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Others">Others</option>
        </select>
        <input
          type="text"
          placeholder="Note (optional)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:flex-grow"
        />
        <button
          type="submit"
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition w-full md:w-40"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
}

export default AddExpense;
