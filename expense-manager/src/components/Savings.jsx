import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

function GlobalTransactions({ user }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/allTransactions`),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-700">Global Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-600">No transactions yet.</p>
      ) : (
        <ul className="space-y-4 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <li key={tx.id} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-lg font-semibold ${
                    tx.type === 'add' ? 'text-green-500' :
                    tx.type === 'withdraw' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {tx.type === 'add' && `+₹${tx.amount.toFixed(2)}`}
                    {tx.type === 'withdraw' && `-₹${tx.amount.toFixed(2)}`}
                    {tx.type === 'goal_deleted' && `Goal deleted (₹${tx.amount.toFixed(2)} moved)`}
                  </p>
                  <p className="text-sm text-gray-500">Goal: {tx.goalTitle || 'N/A'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {tx.date?.toDate().toLocaleString() || 'Pending'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 capitalize">{tx.type}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Savings() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [goals, setGoals] = useState([]);
  const [addAmounts, setAddAmounts] = useState({});
  const [withdrawAmounts, setWithdrawAmounts] = useState({});
  const [deletingGoalId, setDeletingGoalId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const goalsRef = user ? collection(db, `users/${user.uid}/budgets`) : null;

  useEffect(() => {
    if (!user || !goalsRef) return;
    const q = query(goalsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGoals(goalsData);
    });
    return () => unsubscribe();
  }, [user, goalsRef]);

  const addGoal = async () => {
    if (!title || !targetAmount || isNaN(targetAmount)) {
      alert('Please enter valid goal details.');
      return;
    }
    try {
      await addDoc(goalsRef, {
        title,
        targetAmount: parseFloat(targetAmount),
        savedAmount: 0,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setTargetAmount('');
      alert(`Goal "${title}" added successfully!`);
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal.');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!user) {
      alert('You must be logged in to delete a goal.');
      return;
    }

    setDeletingGoalId(goalId);

    try {
      const goalDocRef = doc(db, `users/${user.uid}/budgets/${goalId}`);
      const goalSnap = await getDoc(goalDocRef);

      if (!goalSnap.exists()) {
        alert('Goal not found.');
        setDeletingGoalId(null);
        return;
      }

      const goalData = goalSnap.data();
      const savedAmount = goalData.savedAmount || 0;

      if (savedAmount > 0) {
        const walletDocRef = doc(db, `wallets/${user.uid}`);
        const walletSnap = await getDoc(walletDocRef);

        if (!walletSnap.exists()) {
          await setDoc(walletDocRef, { balance: 0 });
        }

        await updateDoc(walletDocRef, {
          balance: increment(savedAmount),
        });

        await addDoc(collection(db, `wallets/${user.uid}/transactions`), {
          type: 'deposit',
          amount: savedAmount,
          timestamp: serverTimestamp(),
        });
      }

      await addDoc(collection(db, `users/${user.uid}/allTransactions`), {
        goalTitle: goalData.title,
        goalId: goalId,
        type: 'goal_deleted',
        amount: savedAmount,
        date: serverTimestamp(),
      });

      await deleteDoc(goalDocRef);
      alert(`"${goalData.title}" was deleted. ₹${savedAmount.toFixed(2)} was transferred to your wallet.`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal.');
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleAddToGoal = async (goal, amount) => {
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount to add.');
      return;
    }

    const amountToAdd = parseFloat(amount);

    try {
      const res = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
        },
        body: JSON.stringify({ amount: amountToAdd }),
      });

      const order = await res.json();
      if (!order || !order.id) throw new Error('Failed to create Razorpay order');

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: 'INR',
        name: 'PocketPal',
        description: `Add to goal: ${goal.title}`,
        order_id: order.id,
        handler: async function (response) {
          const goalRef = doc(db, `users/${user.uid}/budgets/${goal.id}`);
          const newSavedAmount = goal.savedAmount + amountToAdd;

          await updateDoc(goalRef, { savedAmount: newSavedAmount });

          await addDoc(collection(db, `users/${user.uid}/allTransactions`), {
            goalTitle: goal.title,
            goalId: goal.id,
            type: 'add',
            amount: amountToAdd,
            date: serverTimestamp(),
            razorpay_payment_id: response.razorpay_payment_id,
          });

          setAddAmounts((prev) => ({ ...prev, [goal.id]: '' }));
          alert(`₹${amountToAdd.toFixed(2)} added to "${goal.title}"`);

          if (newSavedAmount >= goal.targetAmount) {
            alert(`🎉 Congratulations! You've reached your goal: "${goal.title}"`);
          }
        },
        theme: { color: '#0ea5e9' },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error('Error processing Razorpay payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleWithdrawFromGoal = async (goal, amount) => {
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount to withdraw.');
      return;
    }
    const amountToWithdraw = parseFloat(amount);
    if (amountToWithdraw > goal.savedAmount) {
      alert("You can't withdraw more than what's saved.");
      return;
    }
    const newSavedAmount = goal.savedAmount - amountToWithdraw;
    try {
      const goalDoc = doc(db, `users/${user.uid}/budgets/${goal.id}`);
      await updateDoc(goalDoc, { savedAmount: newSavedAmount });
      setWithdrawAmounts((prev) => ({ ...prev, [goal.id]: '' }));

      await addDoc(collection(db, `users/${user.uid}/allTransactions`), {
        goalTitle: goal.title,
        goalId: goal.id,
        type: 'withdraw',
        amount: amountToWithdraw,
        date: serverTimestamp(),
      });

      alert(`₹${amountToWithdraw.toFixed(2)} withdrawn from "${goal.title}".`);
    } catch (error) {
      console.error('Error withdrawing from goal:', error);
      alert('Failed to withdraw amount from goal.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-gray-600 text-lg">
          Loading your savings data...
        </main>
        <footer className="bg-gray-900 text-gray-400 py-4 text-center">
          &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Savings & Budget Planner</h2>

        {/* Goal Add Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Add New Goal</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Goal title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/2"
            />
            <input
              type="number"
              placeholder="Target amount..."
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/3"
            />
            <button
              onClick={addGoal}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition w-full md:w-40"
            >
              Add Goal
            </button>
          </div>
        </div>

        {/* Existing Goals List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Your Goals</h3>
          {goals.length === 0 ? (
            <p className="text-gray-600">No goals yet. Start planning your savings!</p>
          ) : (
            <ul className="space-y-6">
              {goals.map((goal) => {
                const progress = Math.min(goal.savedAmount / goal.targetAmount, 1);
                return (
                  <li key={goal.id} className="border-b pb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{goal.title}</h4>
                        <p className="text-sm text-gray-500">Target: ₹{goal.targetAmount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        disabled={deletingGoalId === goal.id}
                        className={`${
                          deletingGoalId === goal.id
                            ? 'bg-gray-400 cursor-wait'
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white text-sm font-bold py-2 px-3 rounded-lg transition`}
                      >
                        {deletingGoalId === goal.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div
                        className={`h-4 rounded-full ${progress >= 1 ? 'bg-green-500' : 'bg-cyan-500'}`}
                        style={{ width: `${progress * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <input
                        type="number"
                        placeholder="Amount to add..."
                        value={addAmounts[goal.id] || ''}
                        onChange={(e) => setAddAmounts((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/3"
                      />
                      <button
                        onClick={() => handleAddToGoal(goal, addAmounts[goal.id])}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition w-full md:w-40"
                      >
                        Add Money
                      </button>

                      <input
                        type="number"
                        placeholder="Amount to withdraw..."
                        value={withdrawAmounts[goal.id] || ''}
                        onChange={(e) => setWithdrawAmounts((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 w-full md:w-1/3 mt-2"
                      />
                      <button
                        onClick={() => handleWithdrawFromGoal(goal, withdrawAmounts[goal.id])}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition w-full md:w-40 mt-2"
                      >
                        Withdraw
                      </button>

                      <p className="text-sm text-gray-600">Saved: ₹{goal.savedAmount.toFixed(2)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <GlobalTransactions user={user} />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-4 text-center">
        &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
      </footer>
    </div>
  );
}

export default Savings;
