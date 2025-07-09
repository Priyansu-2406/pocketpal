import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const walletDocRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletDocRef);
      if (walletSnap.exists()) {
        setBalance(walletSnap.data().balance || 0);
      } else {
        await setDoc(walletDocRef, { balance: 0 });
        setBalance(0);
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, `wallets/${user.uid}/transactions`),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(txns);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount.');
      return;
    }
    const amt = parseFloat(amount);
    const user = auth.currentUser;
    const walletDocRef = doc(db, 'wallets', user.uid);
    const transactionsRef = collection(db, `wallets/${user.uid}/transactions`);

    try {
      const newBalance = balance - amt;
      if (newBalance < 0) {
        alert('Insufficient funds!');
        return;
      }

      await updateDoc(walletDocRef, { balance: newBalance });
      await addDoc(transactionsRef, {
        type: 'withdraw',
        amount: amt,
        timestamp: serverTimestamp(),
      });

      setBalance(newBalance);
      setAmount('');
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Withdraw failed. Please try again.');
    }
  };

  const handleDeposit = async () => {
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount.');
      return;
    }

    const amt = parseFloat(amount);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // 🔐 Pass token here
        },
        body: JSON.stringify({ amount: amt }),
      });

      const order = await response.json();
      if (!order || !order.id) {
        throw new Error('Failed to get Razorpay order');
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: 'INR',
        name: 'PocketPal',
        description: 'Wallet Top-up',
        order_id: order.id,
        handler: async function (response) {
          const walletDocRef = doc(db, 'wallets', user.uid);
          const transactionsRef = collection(db, `wallets/${user.uid}/transactions`);
          const newBalance = balance + amt;

          await updateDoc(walletDocRef, { balance: newBalance });
          await addDoc(transactionsRef, {
            type: 'deposit',
            amount: amt,
            timestamp: serverTimestamp(),
            razorpay_payment_id: response.razorpay_payment_id,
          });

          setBalance(newBalance);
          setAmount('');
          alert('Deposit successful!');
        },
        theme: { color: '#0ea5e9' },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Your Wallet</h2>

        <div className="bg-white p-6 rounded-lg shadow mb-8 text-center">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Current Balance</h3>
          <p className="text-4xl font-bold text-green-500 mb-4">₹{balance.toFixed(2)}</p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-64"
            />
            <button
              onClick={handleDeposit}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition w-full md:w-40"
            >
              Deposit
            </button>
            <button
              onClick={handleWithdraw}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition w-full md:w-40"
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-gray-600">No wallet transactions yet.</p>
          ) : (
            <ul className="space-y-4">
              {transactions.map((txn) => (
                <li key={txn.id} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        className={`text-lg font-semibold ${
                          txn.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {txn.type === 'deposit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {txn.timestamp?.toDate().toLocaleString() || 'Pending...'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 capitalize">{txn.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-4 text-center">
        &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
      </footer>
    </div>
  );
}

export default Wallet;
