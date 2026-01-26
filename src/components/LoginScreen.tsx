import { useState } from 'react';
import { signInWithGoogle } from '../utilities/auth';

type LoginScreenProps = {
  onSignIn: () => void;
};

export const LoginScreen = ({ onSignIn }: LoginScreenProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <header className="login-header">
          {/* <p className="eyebrow">Northwestern Student Hangouts</p> */}
          {/* <h1>The Move</h1> */}
          {/* <p className="tagline">A live feed for spontaneous campus plans.</p> */}
        </header>

        <div className="login-content">
          <h2>Welcome to The Move!</h2>
          {/* <p>Sign in with your Google account to get started.</p> */}
          <p className="tagline">A live feed for spontaneous campus plans.</p>

          {error && <div className="login-error">{error}</div>}

          <button
            type="button"
            className="btn btn--primary login-button"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};
