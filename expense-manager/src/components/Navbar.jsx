import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const linkClass = (path) =>
    `hover:underline ${location.pathname === path ? 'underline font-bold' : ''}`;

  return (
    <nav className="bg-cyan-500 text-white shadow">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 sm:gap-6 text-base sm:text-lg font-semibold text-center md:text-left">
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
          </Link>
          <Link to="/reports" className={linkClass('/reports')}>
            Reports
          </Link>
          <Link to="/wallet" className={linkClass('/wallet')}>
            Wallet
          </Link>
          <Link to="/savings" className={linkClass('/savings')}>
            Savings
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="bg-white text-cyan-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition w-full md:w-auto"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
