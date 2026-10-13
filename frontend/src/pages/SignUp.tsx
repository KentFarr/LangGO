import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router';
import AuthCard from '../components/AuthCard';
import { authErrorMessage } from '../lib/authErrors';
import { auth } from '../lib/firebase';

const MIN_PASSWORD_LENGTH = 6;

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      // Creating an account signs the user in; keep them out until the email is verified.
      await signOut(auth);
      setRegisteredEmail(email);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthCard title="Check your email">
        <Alert variant="success">
          Your account was created. We sent a verification link to{' '}
          <strong>{registeredEmail}</strong>. Verify your email, then log in.
        </Alert>
        <Link to="/login" className="btn btn-primary w-100">
          Go to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Sign up">
      <Form onSubmit={handleSignUp}>
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
