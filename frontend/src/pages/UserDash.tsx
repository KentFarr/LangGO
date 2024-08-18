import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/FileUpload';

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
      <FileUpload />
    </div>
  );
};

export default UserDash;
