import { driver, type DriveStep } from 'driver.js';
import { CircleQuestionMark } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { tourFor } from '../tours/tours';
import 'driver.js/dist/driver.css';

/**
 * The way in for somebody who has never used a system like this.
 *
 * It shows the tour for the screen you are standing on, and only the
 * steps that person can actually act on: a mechanic is never walked
 * through a button their role does not give them.
 */
export function HelpButton() {
  const { pathname } = useLocation();
  const { principal } = useAuth();
  const tour = tourFor(pathname);
  if (!tour) return null;

  const start = () => {
    const canManage = tour.needs ? can(principal, tour.needs) : false;
    // a last check against the page itself: a step whose anchor is not
    // on screen would show as a floating box talking about nothing, and
    // this catches whatever the permission table has not heard about yet
    const steps = tour
      .build({ canManage })
      .filter(
        (step: DriveStep) =>
          !step.element || document.querySelector(step.element as string),
      );

    driver({
      steps,
      // spelled out rather than left in English defaults, so every word
      // on screen is one we chose
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
      showProgress: true,
      popoverClass: 'mts-tour',
      overlayColor: '#0a0b0c',
      overlayOpacity: 0.75,
      stagePadding: 6,
      stageRadius: 12,
      allowKeyboardControl: true,
    }).drive();
  };

  return (
    <button
      type="button"
      onClick={start}
      data-tour="help"
      className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:border-lime/40 hover:text-ink"
    >
      <CircleQuestionMark className="size-4" strokeWidth={1.75} />
      {tour.label}
    </button>
  );
}
