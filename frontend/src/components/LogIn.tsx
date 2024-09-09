import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig'; // Adjust the path to your firebaseConfig file
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Row, Col, Nav } from 'react-bootstrap'; // Import Bootstrap components
import NavBar from './NavBar';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Handle successful login (e.g., redirect to profile page)
      navigate('/userdashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Container className="d-flex justify-content-center mt-5">
      <Form onSubmit={handleLogin} style={{ width: '300px' }}> {/* Set a fixed width for centering */}
        <h2 className="mb-4 text-center">Login</h2> {/* Center the heading text */}
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
      </Form>
    </Container>
  );
};
export default Login;
