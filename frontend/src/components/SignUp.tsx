import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import styled from 'styled-components';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Styled Components for custom styles
const StyledFormWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #495E57, #45474B);

  .signup-form {
    width: 100%;
    max-width: 400px;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    background-color: white;
  }

  h2 {
    color: #4a4a4a;
    font-weight: bold;
  }

  .form-control {
    box-shadow: none;
    border-radius: 5px;
  }

  .btn-secondary {
    background-color: #495E57;
    border-color: #495E57;
    border-radius: 50px;
    transition: all 0.3s ease;

    &:hover {
      background-color: #F4CE14;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }

  .alert {
    font-size: 0.9rem;
  }
`;

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setEmailSentMessage(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Handle successful sign-up
      setSuccessMessage("Account created successfully! Redirecting to login...");
      setEmailSentMessage("A verification email has been sent to your email address. Please verify your email before logging in.");
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login'); // Redirect to login after a short delay
      }, 5000); // 5 seconds delay before redirecting
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <StyledFormWrapper>
      <Container className="d-flex justify-content-center">
        <Form onSubmit={handleSignUp} className="signup-form">
          <h2 className="mb-4 text-center">Sign Up</h2>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email:</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password:</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="secondary" type="submit" className="w-100">
            Sign Up
          </Button>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mt-3">
              {successMessage}
            </Alert>
          )}

          {emailSentMessage && (
            <Alert variant="info" className="mt-3">
              {emailSentMessage}
            </Alert>
          )}
        </Form>
      </Container>
    </StyledFormWrapper>
  );
};

export default SignUp;
