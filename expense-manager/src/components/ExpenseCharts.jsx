import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function ExpenseCharts() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, `users/${user.uid}/expenses`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, []);

  // Prepare pie chart data: category-wise totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Expenses by Category",
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0",
          "#00BCD4", "#795548", "#607D8B",
        ],
      },
    ],
  };

  // Prepare bar chart data: expenses by date
  const dateTotals = {};
  expenses.forEach((expense) => {
    const date = expense.createdAt?.toDate().toLocaleDateString() || "Pending";
    dateTotals[date] = (dateTotals[date] || 0) + expense.amount;
  });

  const barData = {
    labels: Object.keys(dateTotals),
    datasets: [
      {
        label: "Expenses by Date",
        data: Object.values(dateTotals),
        backgroundColor: "#2196F3",
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition mt-8">
      <h3 className="text-xl font-bold mb-6 text-gray-700">Expense Insights</h3>
      {expenses.length === 0 ? (
        <p className="text-gray-600">Add expenses to see charts here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-600">By Category</h4>
            <Pie data={pieData} />
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2 text-gray-600">By Date</h4>
            <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseCharts;
