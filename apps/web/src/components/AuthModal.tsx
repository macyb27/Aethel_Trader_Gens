import { Component, createSignal, Show } from 'solid-js';
import { authActions } from '../store/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: Component<AuthModalProps> = (props) => {
  const [mode, setMode] = createSignal<'signin' | 'signup'>('signin');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [success, setSuccess] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email() || !password()) {
      setError('Please fill in all fields');
      return;
    }

    if (mode() === 'signup' && password() !== confirmPassword()) {
      setError('Passwords do not match');
      return;
    }

    if (password().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    if (mode() === 'signin') {
      const { error: signInError } = await authActions.signIn(email(), password());
      if (signInError) {
        setError(signInError.message);
      } else {
        props.onClose();
      }
    } else {
      const { error: signUpError } = await authActions.signUp(email(), password());
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Account created successfully! You can now sign in.');
        setMode('signin');
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <Show when={props.isOpen}>
      <div class="modal-overlay" onClick={() => props.onClose()}>
        <div class="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">
              {mode() === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            <button class="modal-close" onClick={() => props.onClose()}>
              &times;
            </button>
          </div>

          <form class="auth-form" onSubmit={handleSubmit}>
            <Show when={error()}>
              <div class="auth-error">{error()}</div>
            </Show>

            <Show when={success()}>
              <div class="auth-success">{success()}</div>
            </Show>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                type="email"
                class="form-input"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="your@email.com"
                disabled={loading()}
              />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                type="password"
                class="form-input"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="Enter password"
                disabled={loading()}
              />
            </div>

            <Show when={mode() === 'signup'}>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input
                  type="password"
                  class="form-input"
                  value={confirmPassword()}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  placeholder="Confirm password"
                  disabled={loading()}
                />
              </div>
            </Show>

            <button
              type="submit"
              class="btn btn-primary btn-full"
              disabled={loading()}
            >
              {loading()
                ? 'Loading...'
                : mode() === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div class="auth-switch">
            <Show
              when={mode() === 'signin'}
              fallback={
                <>
                  Already have an account?{' '}
                  <button
                    class="auth-switch-btn"
                    onClick={() => {
                      setMode('signin');
                      resetForm();
                    }}
                  >
                    Sign In
                  </button>
                </>
              }
            >
              Don't have an account?{' '}
              <button
                class="auth-switch-btn"
                onClick={() => {
                  setMode('signup');
                  resetForm();
                }}
              >
                Create Account
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default AuthModal;
