import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function ListExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ amount: '', category: '', note: '' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/expenses`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, []);

  const categoryColors = {
    Food: 'bg-green-100 text-green-700',
    Transport: 'bg-blue-100 text-blue-700',
    Shopping: 'bg-yellow-100 text-yellow-700',
    Utilities: 'bg-purple-100 text-purple-700',
    Entertainment: 'bg-pink-100 text-pink-700',
    Healthcare: 'bg-red-100 text-red-700',
    Others: 'bg-gray-100 text-gray-700',
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const user = auth.currentUser;
        await deleteDoc(doc(db, `users/${user.uid}/expenses/${id}`));
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditData({
      amount: expense.amount,
      category: expense.category,
      note: expense.note || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    try {
      await updateDoc(doc(db, `users/${user.uid}/expenses/${editingId}`), {
        amount: parseFloat(editData.amount),
        category: editData.category,
        note: editData.note,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition w-full">
      <h3 className="text-xl font-bold mb-4 text-gray-700">Your Expenses</h3>
      {expenses.length === 0 ? (
        <p className="text-gray-600">No expenses yet. Add one above to get started!</p>
      ) : (
        <ul className="space-y-4">
          {expenses.map((expense) => (
            <li key={expense.id} className="border-b pb-2">
              {editingId === expense.id ? (
                <form onSubmit={handleUpdate} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                      className="w-full px-2 py-1 border rounded"
                      required
                    />
                    <select
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full px-2 py-1 border rounded"
                      required
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
                  </div>
                  <textarea
                    value={editData.note}
                    onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  ></textarea>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-full sm:w-auto"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">₹{expense.amount.toFixed(2)}</p>
                    <p className="mt-1">
                      <span
                        className={`inline-block text-xs font-bold py-1 px-2 rounded ${
                          categoryColors[expense.category] || 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {expense.category}
                      </span>
                    </p>
                    {expense.note && (
                      <p className="text-xs text-gray-400 mt-1 italic">{expense.note}</p>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col gap-1">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {expense.createdAt?.toDate().toLocaleString() || "Pending..."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListExpenses;
