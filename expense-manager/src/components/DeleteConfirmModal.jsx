import React, { useState, useEffect } from 'react';

function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');

  // Make confirmation check case-insensitive
  const isConfirmed = confirmation.trim().toLowerCase() === 'delete';

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmation('');
    }
  }, [isOpen]);

  if (!isOpen) return null; // Only render when isOpen is true

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
        <p className="text-gray-700 mb-4">
          Type <span className="font-bold text-red-600">DELETE</span> below to confirm deletion of this split.
        </p>
        <input
          type="text"
          className="border w-full p-3 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
          placeholder="Type DELETE here..."
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={isConfirmed ? onConfirm : undefined}
            disabled={!isConfirmed}
            className={`py-2 px-4 rounded font-bold ${
              isConfirmed
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
