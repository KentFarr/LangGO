import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import AuthSplit from '../components/layout/AuthSplit';
import { Bilingual, Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Feedback';
import { TextField } from '../components/ui/Form';
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
    <AuthSplit photo="fuji-garden" title="Create your account" ja="新規登録">
      <form onSubmit={handleSignUp} className="space-y-7">
        <TextField label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : <Bilingual en="Sign up" ja="新規登録" />}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-ai underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthSplit>
  );
}
