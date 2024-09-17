import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig'; // Adjust the path to your firebaseConfig file
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert } from 'react-bootstrap'; // Import Bootstrap components
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

  .login-form {
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

  .btn-primary {
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

  .forgot-password {
    text-align: center;
    margin-top: 10px;
    color: #4a6fa5;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
      color: #F4CE14;
    }
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user's email is verified
      if (user.emailVerified) {
        // If verified, redirect to dashboard
        navigate('/userdashboard');
      } else {
        // If not verified, sign out the user and show an error message
        await signOut(auth);
        setError("Your email is not verified. Please verify your email before logging in.");
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email has been sent. Please check your inbox.");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <StyledFormWrapper>
      <Container className="d-flex justify-content-center">
        <Form onSubmit={handleLogin} className="login-form">
          <h2 className="mb-4 text-center">Login</h2>
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

          <Button variant="primary" type="submit" className="w-100">
            Login
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

          <div className="forgot-password" onClick={handleResetPassword}>
            Forgot Password?
          </div>
        </Form>
      </Container>
    </StyledFormWrapper>
  );
};

export default Login;
