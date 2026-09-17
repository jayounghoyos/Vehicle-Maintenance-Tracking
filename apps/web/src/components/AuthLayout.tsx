import { useState } from 'react';

import { Logo } from './Logo';

/** The shell the signed-out screens share. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
  );
}

/**
 * What is wrong with a field, said the way the person filling it in
 * would say it.
 *
 * The browser already knows: it is holding a ValidityState and a message
 * for it. The message is the problem. "Please include an '@' in the email
 * address. 'dsadas' is missing an '@'." describes the string rather than
 * telling anybody what to type, and it only appears on submit, in a
 * bubble that vanishes.
 */
function describeValidity(input: HTMLInputElement, label: string): string {
  const { validity } = input;

  if (validity.valueMissing) return `${label} is needed`;
  if (validity.typeMismatch && input.type === 'email') {
    return 'An email address looks like name@company.com';
  }
  if (validity.tooShort) return `At least ${input.minLength} characters`;
  if (validity.rangeUnderflow) return `${label} cannot be below ${input.min}`;
  if (validity.rangeOverflow) return `${label} cannot be above ${input.max}`;
  if (validity.stepMismatch || validity.badInput) return `${label} is not a number`;

  // whatever is left is rarer than the phrasing needed to cover it
  return input.validationMessage;
}

export function Field({
  label,
  hint,
  ...props
}: {
  label: string;
  /** What to put here, said before anybody types rather than after. */
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <label className="block">
      <span className="mb-1 block text-body text-ink-muted">{label}</span>
      {hint && <span className="mb-1.5 block text-[12px] text-ink-muted/70">{hint}</span>}
      <input
        {...props}
        aria-invalid={problem ? true : undefined}
        // the native bubble is what we are replacing, so it never opens
        onInvalid={(event) => {
          event.preventDefault();
          setProblem(describeValidity(event.currentTarget, label));
        }}
        onBlur={(event) => {
          const input = event.currentTarget;
          // an empty field somebody has not filled in yet is not a mistake
          const quiet = input.value === '' || input.validity.valid;
          setProblem(quiet ? null : describeValidity(input, label));
          props.onBlur?.(event);
        }}
        onChange={(event) => {
          if (problem && event.currentTarget.validity.valid) setProblem(null);
          props.onChange?.(event);
        }}
        className={`w-full rounded-xl border bg-panel px-3.5 py-2.5 text-body placeholder:text-ink-muted/60 focus:outline-none ${
          problem
            ? 'border-overdue/60 focus:border-overdue'
            : 'border-white/10 focus:border-lime/40'
        }`}
      />
      {problem && (
        <span className="mt-1.5 block text-[12px] text-overdue">{problem}</span>
      )}
    </label>
  );
}

/** Field's sibling for a fixed set of answers. Team.tsx wrote this by
 *  hand and the vehicle form needs two of them. */
export function Select({
  label,
  options,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body text-ink-muted">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body focus:border-lime/40 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-panel">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Working…' : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-overdue/15 px-3.5 py-2.5 text-body text-overdue">
      {message}
    </p>
  );
}
