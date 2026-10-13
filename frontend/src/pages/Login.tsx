import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { useAuth } from '../auth/useAuth';
import AuthSplit from '../components/layout/AuthSplit';
import { Bilingual, Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { TextField } from '../components/ui/Form';
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
    <AuthSplit photo="doves" title="Welcome back" ja="ログイン">
      <form onSubmit={handleLogin} className="space-y-7">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : <Bilingual en="Log in" ja="ログイン" />}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          New to LangGo?{' '}
          <Link to="/signup" className="text-ai underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthSplit>
  );
}
