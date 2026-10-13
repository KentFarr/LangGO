import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { useAuth } from '../auth/useAuth';
import AuthCard from '../components/AuthCard';
import { authErrorMessage } from '../lib/authErrors';
import { auth } from '../lib/firebase';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (user?.emailVerified && !submitting) return <Navigate to={redirectTo} replace />;

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const { user: signedIn } = await signInWithEmailAndPassword(auth, email, password);
      if (signedIn.emailVerified) {
        navigate(redirectTo, { replace: true });
        return;
      }

      await sendEmailVerification(signedIn).catch(() => {
        // Rate limited or already sent recently; the message below still applies.
      });
      await signOut(auth);
      setError(
        'Your email address is not verified yet. We sent you a verification link. ' +
          'Please check your inbox, then log in again.',
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email address above, then choose "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNotice('If an account exists for that email, a password reset link is on its way.');
    } catch (err) {
      setError(authErrorMessage(err));
    }
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
        {notice && (
          <Alert variant="success" className="mt-3 mb-0">
            {notice}
          </Alert>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button variant="link" className="p-0" onClick={handleResetPassword}>
            Forgot password?
          </Button>
          <Link to="/signup">Create an account</Link>
        </div>
      </Form>
    </AuthCard>
  );
}
