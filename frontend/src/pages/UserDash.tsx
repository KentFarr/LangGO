import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UserDash: React.FC = () => {
  const { user, loading } = useAuth(); // Destructure loading state as well

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth state
  }

  if (!user) {
    return <Navigate to="/login" />; // Redirect if not logged in
  }

  return (
    <div>
      <h1>User Dashboard</h1>
      <Link to="/upload">Upload</Link>
    </div>
  );
};

export default UserDash;
