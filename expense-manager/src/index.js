import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Optional: keep if you want global styles
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
