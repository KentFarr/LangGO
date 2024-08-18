import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './components/SignUp';
import FileUpload from './components/FileUpload';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/upload" element={<FileUpload />} />
      </Routes>
    </Router>
  );
};

export default App;
