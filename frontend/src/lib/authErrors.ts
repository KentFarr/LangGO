import { FirebaseError } from 'firebase/app';

const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/missing-password': 'Please enter your password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

/** Turns Firebase Auth errors into messages suitable for end users. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError && MESSAGES[error.code]) {
    return MESSAGES[error.code]!;
  }
  console.error(error);
  return 'Something went wrong. Please try again.';
}
