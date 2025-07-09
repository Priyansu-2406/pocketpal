import React from 'react';
import Navbar from './Navbar';
import AddExpense from './AddExpense';
import SplitExpense from './SplitExpense';

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 text-center sm:text-left">
          Welcome to PocketPal!
        </h2>

        <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg text-center sm:text-left">
          Add new expenses quickly using the form below or split shared expenses with friends.
        </p>

        {/* Add Expense Form */}
        <AddExpense onExpenseAdded={() => {}} />

        {/* Split Expense Section */}
        <SplitExpense />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-4 text-center text-sm sm:text-base">
        &copy; {new Date().getFullYear()} PocketPal. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
