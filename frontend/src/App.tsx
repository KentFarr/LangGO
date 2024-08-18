import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './components/SignUp';
import FileUpload from './components/FileUpload';
import LogIn from './components/LogIn';
import UserDash from './pages/UserDash';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/userdashboard" element={<UserDash />} />
      </Routes>
    </Router>
  );
};

export default App;
