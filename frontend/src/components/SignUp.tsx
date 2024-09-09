import React, { useState } from 'react';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import { Container, Form, Button, Alert } from 'react-bootstrap';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Handle successful sign-up (e.g., redirect to profile page)
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (    
    <Container className="d-flex justify-content-center mt-5">
      <Form onSubmit={handleSignUp} style={{ width: '300px', padding: '20px', borderRadius: '8px'}}> {/* Set a fixed width for centering */}
        <h2 className="mb-4 text-center">Sign up</h2> {/* Center the heading text */}
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
      </Form>
    </Container>
  );
};
export default SignUp;