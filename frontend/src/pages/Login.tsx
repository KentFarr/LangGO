import { useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { useAuth } from '../auth/useAuth';
import AuthCard from '../components/AuthCard';
import { authClient } from '../lib/authClient';
import { authErrorMessage } from '../lib/authErrors';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(authErrorMessage(signInError));
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthCard title="Log in">
      <Form onSubmit={handleLogin}>
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="login-password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>

        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {error}
          </Alert>
        )}

        <p className="text-center mt-3 mb-0">
          New to LangGo? <Link to="/signup">Create an account</Link>
        </p>
      </Form>
    </AuthCard>
  );
}
