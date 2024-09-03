import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/FileUpload';
import NavBar from '../components/NavBar';


// Add a fallback component in case the module cannot be found

const UserDash: React.FC = () => {
  const { user, loading } = useAuth(); // Destructure loading state as well


  if (loading) {
    return <div>Loading... </div>// checking auth state
  }

  if (!user) {
    return <Navigate to="/login" />; // Redirect if not logged in
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <NavBar brand="LangGo" links={[{ name: 'Home', href: '/' }, { name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />
      <h2>Welcome, {user.email}</h2>
      <FileUpload />
    </div>
  );
};

export default UserDash;
