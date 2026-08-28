import type { DriveStep } from 'driver.js';

import type { Permission } from '../auth/permissions';

/**
 * The guided tours.
 *
 * Whoever opens this has been keeping the fleet in a notebook and a
 * spreadsheet, so the copy assumes nothing: no word is used before it is
 * explained, nothing is called an icon or a panel or a filter, and every
 * step says what a thing is for rather than what it is named.
 *
 * Two rules the copy has to keep. Nothing over forty words, because a
 * paragraph inside a popover is a paragraph nobody reads. And no step
 * describes a control the person looking at it does not have: a mechanic
 * cannot add vehicles, so a mechanic is never told how.
 *
 * Anchored by data-tour attributes rather than class names, so
 * restyling a component cannot silently break the tour.
 */

const anchor = (name: string) => `[data-tour="${name}"]`;

/** Whether this person may change things on the screen in question. */
type Audience = { canManage: boolean };

/** Shown on every screen, since the sidebar is on every screen. */
const workspace: DriveStep[] = [
  {
    element: anchor('sidebar'),
    popover: {
      title: 'The list down the left',
      description:
        'The parts of the system. The one in white is where you are now. The greyed out ones are not built yet.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: anchor('account'),
    popover: {
      title: 'Who you are signed in as',
      description:
        'Your name and your job. What you may change depends on that job, so two people can see different buttons here. Click to sign out.',
      side: 'right',
      align: 'end',
    },
  },
];

/** Said once, early, so the missing buttons are explained rather than
 *  simply absent. */
const readOnly = (what: string): DriveStep => ({
  popover: {
    title: 'What you can do here',
    description: `You can read this, but changing it belongs to the fleet coordinator. That is why there are no buttons here for ${what}.`,
  },
});

export const dashboardTour = (): DriveStep[] => [
  {
    popover: {
      title: 'This is where the fleet lives now',
      description:
        'Until now somebody had to remember when a van needed an oil change. This system remembers: tell it once how often a job happens, and it tells you when the day comes.',
    },
  },
  {
    element: anchor('stat-tiles'),
    popover: {
      title: 'The four numbers at the top',
      description:
        'Your fleet right now. Overdue means the day for a job has passed and nobody recorded doing it. Due soon means within two weeks. In shop means it is being worked on.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: anchor('needs-attention'),
    popover: {
      title: 'What to deal with today',
      description:
        'The vehicles that are late or nearly late, worst first. If this is empty, nothing needs you. Worth a look every morning.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: anchor('recent-events'),
    popover: {
      title: 'What the workshop has done lately',
      description:
        'The jobs finished recently. Recording one here is what moves its next date forward. The name is whoever recorded it.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: anchor('fleet-table'),
    popover: {
      title: 'The whole fleet',
      description:
        'Every vehicle, how far it has travelled and what it needs next, the worst at the top. Vehicles on the left has the full list.',
      side: 'top',
      align: 'start',
    },
  },
  ...workspace,
];

export const vehiclesTour = ({ canManage }: Audience): DriveStep[] => [
  {
    popover: {
      title: 'Your vehicles',
      description:
        'This replaces the sheet where the plates were written down: what each van is, how far it has gone, and whether its maintenance is behind.',
    },
  },
  ...(canManage ? [] : [readOnly('adding, editing or importing vehicles')]),
  {
    element: anchor('vehicle-search'),
    popover: {
      title: 'Finding one vehicle',
      description:
        'Type part of a plate, a make or a model. The list below shrinks as you type. Clear the box to see everything again.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: anchor('vehicle-filter'),
    popover: {
      title: 'Showing only some of them',
      description:
        'Active is out driving, In shop is being worked on, Out of service is retired. The number is how many you have. Click one to see only those.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: anchor('vehicle-headings'),
    popover: {
      title: 'Changing the order',
      description:
        'Click a word to reorder the list by it. Click again to flip it, a third time to undo. Click a second word to sort by both at once.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: anchor('vehicle-row'),
    popover: {
      title: 'Opening one vehicle',
      description:
        'Click anywhere on a line to open that vehicle beside the list: what is recorded about it, the jobs it is booked for, and the last work done.',
      side: 'bottom',
      align: 'start',
    },
  },
  ...(canManage
    ? [
        {
          element: anchor('vehicle-add'),
          popover: {
            title: 'Adding one vehicle',
            description:
              'A short form on the right. Only the plate, the make and the model are required. Whether maintenance is late is never typed in; the system works it out.',
            side: 'bottom' as const,
            align: 'end' as const,
          },
        },
        {
          element: anchor('vehicle-import'),
          popover: {
            title: 'Adding a whole fleet at once',
            description:
              'If your vehicles are already in Excel, this takes them all in one go. It shows what it understood before creating anything, and explains itself when you open it.',
            side: 'bottom' as const,
            align: 'end' as const,
          },
        },
      ]
    : []),
  {
    element: anchor('vehicle-export'),
    popover: {
      title: 'Taking the list back out',
      description:
        'Saves the whole fleet as a file you can open in Excel, for sending to somebody who does not use this system.',
      side: 'left',
      align: 'start',
    },
  },
  ...workspace,
];

export const teamTour = ({ canManage }: Audience): DriveStep[] => [
  {
    popover: {
      title: 'The people who can sign in',
      description:
        'Everyone who works with the fleet needs their own account, because the system records who did what.',
    },
  },
  ...(canManage ? [] : [readOnly('adding or removing accounts')]),
  {
    element: anchor('member-role'),
    popover: {
      title: 'The three jobs',
      description:
        'Fleet coordinator runs the fleet and this list. Mechanic records work once it is done. Operations manager only reads. The jobs differ in what they may change, not in what they see.',
      side: 'left',
      align: 'start',
    },
  },
  ...(canManage
    ? [
        {
          element: anchor('member-add'),
          popover: {
            title: 'Adding one person',
            description:
              'Their name, the email they will sign in with, and a password you give them. All of it can be changed later, including the password if they forget it.',
            side: 'bottom' as const,
            align: 'end' as const,
          },
        },
        {
          element: anchor('member-import'),
          popover: {
            title: 'Adding everybody at once',
            description:
              'Copy the rows out of a spreadsheet and paste them. Leave the password column empty and the system invents one for each person and shows it to you once.',
            side: 'bottom' as const,
            align: 'end' as const,
          },
        },
        {
          element: anchor('member-actions'),
          popover: {
            title: 'When somebody leaves',
            description:
              'The first stops their account working while keeping their name on the work they recorded. The bin only appears for an account that has never recorded anything.',
            side: 'left' as const,
            align: 'start' as const,
          },
        },
      ]
    : []),
  {
    element: anchor('workspace-tabs'),
    popover: {
      title: 'Your company details',
      description:
        'The second word opens what the system has on file about your company. Click either word to swap between them.',
      side: 'bottom',
      align: 'start',
    },
  },
  ...workspace,
];

export const organizationTour = ({ canManage }: Audience): DriveStep[] => [
  {
    popover: {
      title: 'What the service knows about your company',
      description:
        'The other half of this screen: not the people, but the company they work for.',
    },
  },
  ...(canManage ? [] : [readOnly('changing these details')]),
  {
    element: anchor('workspace-tabs'),
    popover: {
      title: 'Two lists, one screen',
      description:
        'The first word shows the people who can sign in. The second, the one you are on, shows the company itself. Click either to swap.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: anchor('organization-details'),
    popover: {
      title: 'Your details',
      description:
        'The name, whoever runs it, where you are and how to reach you. This is what the people running the service use to call you. The email here is not a sign-in.',
      side: 'right',
      align: 'start',
    },
  },
  ...(canManage
    ? [
        {
          element: anchor('organization-edit'),
          popover: {
            title: 'Changing any of it',
            description:
              'Opens the same details as a form on the right. If you moved premises or the phone number changed, this is where it gets corrected.',
            side: 'left' as const,
            align: 'start' as const,
          },
        },
      ]
    : []),
  ...workspace,
];

type Tour = {
  path: string;
  /** names its own screen rather than saying "this page" everywhere: a
   *  button whose words never change reads as one that shows the same
   *  thing every time, so nobody presses it twice */
  label: string;
  /** what counts as being allowed to change this screen */
  needs?: Permission;
  build: (audience: Audience) => DriveStep[];
};

/** Longest path first, so the organization tab does not get the members
 *  tour, whose steps point at buttons that are not on it. */
export const TOURS: Tour[] = [
  {
    path: '/team/organization',
    label: 'How the company details work',
    needs: 'edit_organization',
    build: organizationTour,
  },
  {
    path: '/vehicles',
    label: 'How the vehicle list works',
    needs: 'manage_vehicles',
    build: vehiclesTour,
  },
  {
    path: '/team',
    label: 'How the team list works',
    needs: 'manage_team',
    build: teamTour,
  },
  { path: '/', label: 'How the dashboard works', build: dashboardTour },
];

/** First match wins, and the list is ordered longest first. */
export function tourFor(pathname: string): Tour | undefined {
  return TOURS.find(
    (tour) => pathname === tour.path || pathname.startsWith(`${tour.path}/`),
  );
}
