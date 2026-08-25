type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** so a guided tour can point at this card */
  'data-tour'?: string;
};

/** The card chrome shared by the dashboard panels. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <section
      {...rest}
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-panel ${className}`}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div>
          <h2 className="text-section font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-body text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
