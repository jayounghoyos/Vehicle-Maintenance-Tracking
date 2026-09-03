import { type LucideIcon } from 'lucide-react';

import { useBrand } from '../hooks/useBrand';
import { HelpButton } from './HelpButton';
import { Sidebar } from './Sidebar';

type Props = {
  /** page title and subtitle, left of the header */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** A page-level action, for a screen not built around one table — the
   *  dashboard's "Log service" is the only one. A listing screen's
   *  primary action belongs next to its own table instead, in that
   *  Panel's action prop, the way Vehicles and Team do it. */
  action?: React.ReactNode;
  /** rendered at the bottom of the sidebar */
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, action, sidebarFooter, children }: Props) {
  // one call, here: every signed-in screen goes through this shell, and
  // the accent has to be on before anything paints
  const brand = useBrand();

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Sidebar footer={sidebarFooter} brand={brand} />

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-start justify-between gap-4 px-8 pt-8 pb-6">
          <div>
            <h1 className="text-page-title font-bold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-body text-ink-muted">{subtitle}</p>}
          </div>

          {/* no search here: a box that searches nothing on every screen
              is worse than no box. Each list searches its own rows. */}
          <div className="flex items-center gap-3">
            <HelpButton />
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
  size = 'header',
  ...rest
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  /** 'header' sits beside the help button in AppShell's own header.
   *  'panel' sits in a listing screen's Panel action, sized to match
   *  the controls already there — the vehicle select, the outline
   *  "Import many" button. */
  size?: 'header' | 'panel';
  /** so a guided tour can point at this button */
  'data-tour'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={`flex items-center gap-2 rounded-xl bg-lime text-body font-semibold text-on-accent transition-opacity hover:opacity-90 ${
        size === 'panel' ? 'px-3.5 py-2' : 'px-4 py-2.5'
      }`}
    >
      <Icon className="size-4" strokeWidth={2.5} />
      {children}
    </button>
  );
}
