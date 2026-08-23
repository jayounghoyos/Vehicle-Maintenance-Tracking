import {
  BarChart3,
  CalendarClock,
  LayoutGrid,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Logo } from './Logo';

type NavItem = { to: string; label: string; icon: LucideIcon; ready: boolean };

// What is not built yet stays visible so the workspace reads as it does
// in the mockup, but it does not pretend to navigate.
const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, ready: true },
  { to: '/vehicles', label: 'Vehicles', icon: Truck, ready: true },
  { to: '/schedules', label: 'Schedules', icon: CalendarClock, ready: false },
  { to: '/service-log', label: 'Service Log', icon: Wrench, ready: false },
  { to: '/reports', label: 'Reports', icon: BarChart3, ready: false },
  // the mockup's Settings slot, spent on the team: accounts are the only
  // thing there is anything to configure yet
  { to: '/team', label: 'Team', icon: Users, ready: true },
];

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-8 border-r border-white/5 bg-sidebar p-5">
      <Logo />

      <nav className="flex-1">
        <p className="mb-3 px-3 text-nav-label font-semibold text-ink-muted uppercase">
          Workspace
        </p>
        <ul className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, ready }) => (
            <li key={to}>
              {ready ? (
                <NavLink
                  to={to}
                  // every path starts with "/", so without this the
                  // dashboard reads as active on every screen. Team is
                  // left prefix-matching so it stays lit on its own tabs
                  end={to === '/'}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body transition-colors',
                      // lime marks the active item — the manual's other
                      // sanctioned use of the accent besides the primary action
                      isActive
                        ? 'bg-white/5 font-medium text-ink'
                        : 'text-ink-muted hover:bg-white/5 hover:text-ink',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`size-[18px] ${isActive ? 'text-lime' : ''}`}
                        strokeWidth={1.75}
                      />
                      {label}
                    </>
                  )}
                </NavLink>
              ) : (
                <span
                  aria-disabled
                  title="Not built yet"
                  className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-body text-ink-muted/50"
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                  {label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {footer}
    </aside>
  );
}
