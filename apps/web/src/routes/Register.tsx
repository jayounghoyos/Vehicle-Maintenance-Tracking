import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { AuthLayout, Field, FormError, SubmitButton } from '../components/AuthLayout'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    try {
      await register(Object.fromEntries(form) as Record<string, string>)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not register')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Register your organization"
      subtitle="You will run the fleet, and can add your team afterwards."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="text-lime hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />

        {/* every field organizations requires, asked once */}
        <p className="text-table-label font-semibold text-ink-muted uppercase">
          The organization
        </p>
        <Field label="Name" name="organizationName" required autoFocus />
        <Field label="Director or owner" name="ownerName" required />
        <Field label="Address" name="address" required />
        <Field label="Phone" name="phone" required />
        <Field label="Contact email" name="organizationEmail" type="email" required />

        <p className="pt-2 text-table-label font-semibold text-ink-muted uppercase">
          Your account
        </p>
        <Field label="Full name" name="fullName" required />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <SubmitButton pending={pending}>Create organization</SubmitButton>
      </form>
    </AuthLayout>
  )
}
