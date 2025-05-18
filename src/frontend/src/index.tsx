import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Force dark mode by default (before first render)
document.documentElement.classList.add('dark');

const container = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 