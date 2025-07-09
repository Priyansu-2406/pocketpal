import React from 'react';
import { useNavigate } from 'react-router-dom';

function GuestPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-purple-800 to-indigo-900 text-white">
      {/* Hero Section */}
      <section className="flex-grow flex flex-col justify-center items-center text-center px-4 md:px-6 py-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to <span className="text-cyan-300">PocketPal</span>
        </h1>
        <p className="max-w-2xl text-base sm:text-lg md:text-xl mb-10 text-gray-200">
          Take control of your finances with smart expense tracking, savings goals, and easy bill splitting — all in one beautiful, user-friendly app.
        </p>
        <button
          onClick={handleGetStarted}
          className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold py-3 sm:py-4 px-8 sm:px-10 rounded-full transition duration-300 shadow-lg w-full sm:w-auto"
        >
          Get Started
        </button>
      </section>

      {/* Feature Highlights */}
      <section className="bg-white text-gray-900 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 text-center">
          <div className="bg-gray-100 p-6 sm:p-8 rounded-lg shadow hover:scale-105 transform transition">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Expense Tracking</h3>
            <p>Track your spending easily with categorized transactions and detailed statements.</p>
          </div>
          <div className="bg-gray-100 p-6 sm:p-8 rounded-lg shadow hover:scale-105 transform transition">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Savings Goals</h3>
            <p>Set and monitor goals for your trips, purchases, or future plans — stay motivated!</p>
          </div>
          <div className="bg-gray-100 p-6 sm:p-8 rounded-lg shadow hover:scale-105 transform transition">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Split Expenses</h3>
            <p>Share expenses with friends and keep everything fair with smart bill splitting.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm sm:text-base">
        &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
      </footer>
    </div>
  );
}

export default GuestPage;
