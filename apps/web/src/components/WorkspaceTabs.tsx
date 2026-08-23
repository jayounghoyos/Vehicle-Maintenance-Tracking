import { NavLink } from 'react-router-dom';

/* Two views of the same thing: the people in the organization, and the
 * organization itself. They are routes rather than local state so the
 * back button works and a tab can be linked to. */
const TABS = [
  { to: '/team', label: 'Team', end: true },
  { to: '/team/organization', label: 'Organization', end: false },
];

export function WorkspaceTabs() {
  return (
    <nav className="flex w-fit gap-1 rounded-xl border border-white/5 bg-panel p-1">
      {TABS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'rounded-lg px-3.5 py-2 text-body transition-colors',
              isActive
                ? 'bg-white/10 font-medium text-ink'
                : 'text-ink-muted hover:text-ink',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
