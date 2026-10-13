/** Shape of the `error` returned by Better Auth client calls. */
export interface AuthClientError {
  code?: string;
  message?: string;
  status: number;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  USER_ALREADY_EXISTS: 'An account with this email already exists.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORD_TOO_LONG: 'Password is too long.',
};

/** Turns Better Auth errors into messages suitable for end users. */
export function authErrorMessage(error: AuthClientError): string {
  if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  console.error('Auth error', error);
  return 'Something went wrong. Please try again.';
}
