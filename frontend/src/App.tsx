import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled from 'styled-components'; // Import styled-components
import Home from './pages/Home';
import SignUp from './components/SignUp';
import FileUpload from './components/FileUpload';
import LogIn from './components/LogIn';
import UserDash from './pages/UserDash';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import Privacy from './pages/Privacy';

// Create a styled component that will act as a wrapper for the entire app
const AppWrapper = styled.div`
  background-color: #F5F7F8; /* Set your desired background color */
  color: #495E57;
  min-height: 100vh; /* Ensure it covers the full viewport height */
  display: flex;
  flex-direction: column;
`;

// Main App component
const App: React.FC = () => {
  return (
    <AppWrapper>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/userdashboard" element={<UserDash />} />
          <Route path="/privacy" element={<Privacy />} />
          
        </Routes>
      </Router>
    </AppWrapper>
  );
};

export default App;
