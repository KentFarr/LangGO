import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/FileUpload';
import NavBar from '../components/NavBar';
import FlashcardList from '../components/FlashcardList'; // Import the FlashcardList component
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'react-bootstrap'; // Import Bootstrap's Button
import ReviewSection from '../components/ReviewSection';

const GradientWrapper = styled.div`
  background: #F5F7F8;
  min-height: 100vh;
  padding: 60px 20px;
  color: #495E57;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const DashboardContainer = styled.div`
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 36px;
  color: #495E57;
  text-align: center;
  margin-bottom: 30px;
`;

const SubTitle = styled.h2`
  font-size: 24px;
  color: #495E57;
  text-align: center;
  margin-bottom: 40px;
`;

const Footer = styled.footer`
  margin-top: 50px;
  text-align: center;
  font-size: 14px;
  color: #495E57;
`;

// Keep NavBar outside of GradientWrapper to prevent style overrides
const NavBarWrapper = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
`;

const UserDash: React.FC = () => {
  const { user, loading } = useAuth();
  const [showFlashcards, setShowFlashcards] = useState(false); // Manage flashcards display state

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {/* NavBar is separated and not affected by GradientWrapper styles */}
      <NavBarWrapper>
        <NavBar brand="LangGo" links={[{ name: 'Sign Up', href: '/signup' }, { name: 'Log In', href: '/login' }]} />
      </NavBarWrapper>

      <GradientWrapper>
        <DashboardContainer>
          <Title>
            <FontAwesomeIcon icon={faUser} className="me-2" /> User Dashboard
          </Title>
          <SubTitle>
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Welcome, {user.email}
          </SubTitle>

          <FileUpload />

          <ReviewSection></ReviewSection>

          {/* Add button to toggle flashcard display */}
          <div className="text-center mt-4">
            <Button onClick={() => setShowFlashcards(!showFlashcards)} variant="primary">
              {showFlashcards ? 'Hide Past Flashcards' : 'Show Past Flashcards'}
            </Button>
          </div>

          {/* Conditionally render the FlashcardList based on user action */}
          {showFlashcards && <FlashcardList />}
        </DashboardContainer>

       <Footer>&copy; {new Date().getFullYear()} LangGo. All rights reserved</Footer>
      </GradientWrapper>
    </>
  );
};

export default UserDash;
