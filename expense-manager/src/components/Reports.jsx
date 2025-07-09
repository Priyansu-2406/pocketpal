import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { auth } from '../firebase';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function Reports() {
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      try {
        const res = await fetch('http://localhost:5000/api/expenses', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch expenses.');
        const data = await res.json();
        setExpenses(data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        alert('Failed to load expenses.');
      }
    };

    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.createdAt);
    const categoryMatch = categoryFilter
      ? expense.category.toLowerCase().includes(categoryFilter.toLowerCase())
      : true;
    const startMatch = startDate ? expenseDate >= new Date(startDate) : true;
    const endMatch = endDate ? expenseDate <= new Date(endDate) : true;
    return categoryMatch && startMatch && endMatch;
  });

  const singleExpenseLabels = filteredExpenses.map((expense) =>
    new Date(expense.createdAt).toLocaleDateString() || 'Pending'
  );
  const singleExpenseAmounts = filteredExpenses.map((expense) => expense.amount);

  const barData = {
    labels: singleExpenseLabels,
    datasets: [
      {
        label: 'Individual Expenses',
        data: singleExpenseAmounts,
        backgroundColor: '#2196F3',
      },
    ],
  };

  const monthlyTotals = {};
  filteredExpenses.forEach((expense) => {
    const dateObj = new Date(expense.createdAt);
    const monthYear = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + expense.amount;
  });

  const generateShadesOfBlue = (count) => {
    const shades = [];
    const base = 180;
    const step = Math.floor((255 - base) / Math.max(1, count - 1));
    for (let i = 0; i < count; i++) {
      const intensity = base + step * i;
      shades.push(`rgb(${intensity}, ${intensity}, 255)`);
    }
    return shades;
  };

  const pieData = {
    labels: Object.keys(monthlyTotals),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: Object.values(monthlyTotals),
        backgroundColor: generateShadesOfBlue(Object.keys(monthlyTotals).length),
      },
    ],
  };

  const selectedMonthExpenses = selectedMonth
    ? filteredExpenses.filter((expense) => {
        const dateObj = new Date(expense.createdAt);
        const monthYear = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
        return monthYear === selectedMonth;
      })
    : [];

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export.');
      return;
    }

    const dataToExport = filteredExpenses.map((expense) => ({
      Amount: expense.amount,
      Category: expense.category,
      Note: expense.note || '',
      Date: new Date(expense.createdAt).toLocaleString() || 'Pending',
    }));

    const csv = Papa.unparse(dataToExport);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pocketpal_expenses_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (filteredExpenses.length === 0) {
      alert('No expenses to export.');
      return;
    }

    const doc = new jsPDF();
    doc.text('PocketPal Expense Report', 14, 15);

    const tableData = filteredExpenses.map((expense) => [
      `₹${expense.amount.toFixed(2)}`,
      expense.category,
      expense.note || '',
      new Date(expense.createdAt).toLocaleString() || 'Pending',
    ]);

    doc.autoTable({
      head: [['Amount', 'Category', 'Note', 'Date']],
      body: tableData,
      startY: 25,
    });

    doc.save(`pocketpal_expenses_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center sm:text-left">
          Expense Reports
        </h2>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Filters</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Filter by category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/3"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full md:w-1/4"
            />
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button
                onClick={exportToCSV}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition w-full sm:w-48"
              >
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition w-full sm:w-48"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-700">Filtered Expenses</h3>
          {filteredExpenses.length === 0 ? (
            <p className="text-gray-600">No expenses match your filters.</p>
          ) : (
            <ul className="space-y-4">
              {filteredExpenses.map((expense) => (
                <li key={expense._id} className="border-b pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-gray-800">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">{expense.category}</p>
                      {expense.note && (
                        <p className="text-xs text-gray-400 mt-1 italic">{expense.note}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(expense.createdAt).toLocaleString() || 'Pending...'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {filteredExpenses.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h3 className="text-lg sm:text-xl font-bold mb-6 text-gray-700">Expense Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-600">Monthly Expenses Overview</h4>
                <Pie
                  data={pieData}
                  options={{
                    onClick: (_, elements) => {
                      if (elements && elements.length > 0) {
                        const clickedIndex = elements[0].index;
                        const month = pieData.labels[clickedIndex];
                        setSelectedMonth(month);
                      }
                    },
                    plugins: { legend: { display: true } },
                    responsive: true,
                  }}
                />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-600">Individual Expenses</h4>
                <Bar
                  data={barData}
                  options={{
                    plugins: { legend: { display: false } },
                    responsive: true,
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedMonth && (
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-700">
                Expenses for {selectedMonth}
              </h3>
              <button
                onClick={() => setSelectedMonth('')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-bold py-2 px-4 rounded transition w-full sm:w-auto"
              >
                Back to All Expenses
              </button>
            </div>
            {selectedMonthExpenses.length === 0 ? (
              <p className="text-gray-600">No expenses found for this month.</p>
            ) : (
              <ul className="space-y-4">
                {selectedMonthExpenses.map((expense) => (
                  <li key={expense._id} className="border-b pb-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div>
                        <p className="text-base sm:text-lg font-semibold text-gray-800">
                          ₹{expense.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">{expense.category}</p>
                        {expense.note && (
                          <p className="text-xs text-gray-400 mt-1 italic">{expense.note}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(expense.createdAt).toLocaleString() || 'Pending...'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-4 text-center text-sm sm:text-base">
        &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
      </footer>
    </div>
  );
}

export default Reports;
