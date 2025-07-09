import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import DeleteConfirmModal from './DeleteConfirmModal';

function SplitExpense() {
  const [amount, setAmount] = useState('');
  const [numPeople, setNumPeople] = useState('');
  const [friendNames, setFriendNames] = useState([]);
  const [perPersonDetails, setPerPersonDetails] = useState([]);
  const [splits, setSplits] = useState([]);
  const [category, setCategory] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [splitIdToDelete, setSplitIdToDelete] = useState(null);

  useEffect(() => {
    const fetchSplits = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      try {
        const res = await fetch('http://localhost:5000/api/splits', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        setSplits(data);
      } catch (error) {
        console.error('Error fetching splits:', error);
        alert('Failed to load splits.');
      }
    };

    fetchSplits();
  }, []);

  const handleNumPeopleChange = (e) => {
    const num = parseInt(e.target.value, 10);
    setNumPeople(e.target.value);

    if (!isNaN(num) && num > 0) {
      setFriendNames(Array(num).fill(''));
    } else {
      setFriendNames([]);
    }
  };

  const handleFriendNameChange = (index, value) => {
    const updatedNames = [...friendNames];
    updatedNames[index] = value;
    setFriendNames(updatedNames);
  };

  const handleSplit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const num = parseInt(numPeople, 10);
    if (
      isNaN(amt) ||
      amt <= 0 ||
      isNaN(num) ||
      num <= 0 ||
      !category ||
      friendNames.some((name) => !name.trim())
    ) {
      alert('Please enter valid details for amount, category, and all friends.');
      return;
    }
    const calculatedPerPerson = (amt / num).toFixed(2);
    const details = friendNames.map((name) => ({
      name,
      amount: parseFloat(calculatedPerPerson),
      settled: false,
    }));
    setPerPersonDetails(details);

    const user = auth.currentUser;
    if (!user) {
      alert('Not logged in');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/splits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amt,
          numPeople: num,
          category,
          perPersonDetails: details,
        }),
      });
      if (!res.ok) throw new Error('Failed to save split.');
      await res.json();

      const updatedSplits = await fetch('http://localhost:5000/api/splits', {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then((r) => r.json());
      setSplits(updatedSplits);

      setAmount('');
      setNumPeople('');
      setCategory('');
      setFriendNames([]);
      setPerPersonDetails([]);
    } catch (error) {
      console.error('Error saving split:', error);
      alert('Failed to save split.');
    }
  };

  const handleToggleSettled = async (splitId, personIndex, settleAll = false) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/splits/${splitId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personIndex, settleAll }),
      });
      if (!res.ok) throw new Error('Failed to update split.');

      const updatedSplits = await fetch('http://localhost:5000/api/splits', {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then((r) => r.json());
      setSplits(updatedSplits);
    } catch (error) {
      console.error('Error updating settlement:', error);
      alert('Failed to update settlement.');
    }
  };

  const openDeleteModal = (splitId) => {
    setSplitIdToDelete(splitId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    const user = auth.currentUser;
    if (!user || !splitIdToDelete) return;

    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`http://localhost:5000/api/splits/${splitIdToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete split.');

      const updatedSplits = await fetch('http://localhost:5000/api/splits', {
        headers: { Authorization: `Bearer ${idToken}` },
      }).then((r) => r.json());
      setSplits(updatedSplits);

      setIsDeleteModalOpen(false);
      setSplitIdToDelete(null);
    } catch (error) {
      console.error('Error deleting split:', error);
      alert('Failed to delete split.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h3 className="text-2xl font-bold mb-4 text-gray-700">Split an Expense</h3>
      <p className="text-gray-600 mb-6">
        Enter total amount, number of people, names, and category to split the expense.
      </p>
      <form onSubmit={handleSplit} className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="number"
            placeholder="Total amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
          />
          <input
            type="number"
            placeholder="Number of people..."
            value={numPeople}
            onChange={handleNumPeopleChange}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
          >
            <option value="">Select split category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Rent">Rent</option>
            <option value="Shopping">Shopping</option>
            <option value="Others">Others</option>
          </select>
        </div>

        {friendNames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friendNames.map((name, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Person ${index + 1} name`}
                value={name}
                onChange={(e) => handleFriendNameChange(index, e.target.value)}
                className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition w-full md:w-48"
        >
          Calculate & Save
        </button>
      </form>

      {perPersonDetails.length > 0 && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Split Result:</h4>
          <ul className="space-y-2">
            {perPersonDetails.map((person, idx) => (
              <li key={idx} className="text-gray-700">
                {person.name}: <span className="text-cyan-600 font-bold">₹{person.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {splits.length > 0 && (
        <div className="bg-gray-50 p-4 rounded shadow">
          <h4 className="text-lg font-bold mb-4 text-gray-700">Past Splits</h4>
          <ul className="space-y-4 max-h-96 overflow-y-auto">
            {splits.map((split) => (
              <li key={split._id} className="border-b pb-2">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-bold">{split.category}</span> | Total: <span className="font-bold">₹{split.amount.toFixed(2)}</span> | People: <span className="font-bold">{split.numPeople}</span>
                    </p>
                    <ul className="ml-2 mb-2">
                      {split.perPersonDetails?.map((person, idx) => (
                        <li key={idx} className={`text-sm ${person.settled ? 'text-green-600 line-through' : 'text-cyan-600'}`}>
                          {person.name}: ₹{person.amount.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-400">
                      {new Date(split.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {split.perPersonDetails?.map((person, idx) => (
                      !person.settled && (
                        <button
                          key={idx}
                          onClick={() => handleToggleSettled(split._id, idx)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded transition"
                        >
                          Settle {person.name}
                        </button>
                      )
                    ))}
                    {!split.settled && (
                      <button
                        onClick={() => handleToggleSettled(split._id, null, true)}
                        className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded transition"
                      >
                        Settle All
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(split._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}

export default SplitExpense;
