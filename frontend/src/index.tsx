import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main App component
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

// Find the root element in the HTML file
const rootElement = document.getElementById('root');

// Create a React root and render the App component inside it
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export {};