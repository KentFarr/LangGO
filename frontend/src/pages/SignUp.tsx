import { useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import AuthCard from '../components/AuthCard';
import { authClient } from '../lib/authClient';
import { authErrorMessage } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUp() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && !submitting) return <Navigate to="/dashboard" replace />;

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    // Signing up also signs the user in.
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });
    setSubmitting(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError));
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthCard title="Sign up">
      <Form onSubmit={handleSignUp}>
        <Form.Group className="mb-3" controlId="signup-name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="signup-email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="signup-password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Form.Text>At least {MIN_PASSWORD_LENGTH} characters.</Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signup-confirm-password">
          <Form.Label>Confirm password</Form.Label>
          <Form.Control
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </Button>

        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {error}
          </Alert>
        )}

        <p className="text-center mt-3 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Form>
    </AuthCard>
  );
}
