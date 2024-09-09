import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/FileUpload';
import NavBar from '../components/NavBar';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const GradientWrapper = styled.div`
  background: #45474B);
  min-height: 100vh;
  padding: 40px 
  color: white 
`;


// User Dashboard
const UserDash: React.FC = () => {
  const { user, loading } = useAuth(); // Destructure loading state as well

  if (loading) {
    return <div>Loading...</div>; // Checking auth state
  }

  if (!user) {
    return <Navigate to="/login" />; // Redirect if not logged in
  }

  return (
    <GradientWrapper>
      <NavBar brand="LangGo" links={[{ name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />
      <div className="container">
        <h1 className="text-center mb-4">
          <FontAwesomeIcon icon={faUser} className="me-2" /> User Dashboard
        </h1>
        <h2 className="text-center mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Welcome, {user.email}
        </h2>
        <FileUpload />
      </div>
    </GradientWrapper>
  );
};


export default UserDash;
