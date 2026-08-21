import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/context';
import { AuthLayout, Field, FormError, SubmitButton } from '../components/AuthLayout';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const principal = await signIn(
        String(form.get('email')),
        String(form.get('password')),
      );
      // admins run the service and have no fleet to look at
      navigate(principal.kind === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Fleet maintenance tracking"
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="text-lime hover:underline">
            Register your organization
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
        />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
