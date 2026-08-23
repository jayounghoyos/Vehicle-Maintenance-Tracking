import { Search, type LucideIcon } from 'lucide-react';

import { Sidebar } from './Sidebar';

type Props = {
  /** page title and subtitle, left of the header */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** the one lime action for this screen, if the role has one */
  action?: React.ReactNode;
  /** rendered at the bottom of the sidebar */
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, action, sidebarFooter, children }: Props) {
  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Sidebar footer={sidebarFooter} />

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-start justify-between gap-4 px-8 pt-8 pb-6">
          <div>
            <h1 className="text-page-title font-bold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-body text-ink-muted">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                placeholder="Search plate, vehicle or task"
                className="w-80 rounded-xl border border-white/10 bg-panel py-2.5 pr-4 pl-10 text-body placeholder:text-ink-muted focus:border-lime/40 focus:outline-none"
              />
            </div>
            {action}
          </div>
        </header>

        <main className="px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}

/** The one lime action a screen is allowed. A role that may not perform
 *  it gets no disabled button: an action you can never take is noise, so
 *  the screen simply does not offer it. */
export function PrimaryAction({
  icon: Icon,
  children,
  onClick,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90"
    >
      <Icon className="size-4" strokeWidth={2.5} />
      {children}
    </button>
  );
}
