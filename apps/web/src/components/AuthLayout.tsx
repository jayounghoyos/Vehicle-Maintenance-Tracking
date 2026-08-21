import { Logo } from './Logo'

/** The shell the signed-out screens share. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-6 py-12 text-ink">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 text-page-title font-bold">{title}</h1>
        <p className="mt-2 text-body text-ink-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-body text-ink-muted">{footer}</div>}
      </div>
    </main>
  )
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body text-ink-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body placeholder:text-ink-muted/60 focus:border-lime/40 focus:outline-none"
      />
    </label>
  )
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Working…' : children}
    </button>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="rounded-xl bg-overdue/15 px-3.5 py-2.5 text-body text-overdue">
      {message}
    </p>
  )
}
