import type { User } from '../entities';

/** Who did the work, as the log and a vehicle's history show it. */
export type Performer = {
  /** a member's name or an outside workshop's. null only for an event
   *  the history cannot attribute */
  performer: string | null;
  /** true when the performer is an outside workshop with no account */
  performerExternal: boolean;
};

/** A member's name when one did the work, otherwise the workshop's. */
export function performerOf(member: User | null, workshop: string | null): Performer {
  if (member) return { performer: member.fullName, performerExternal: false };
  return { performer: workshop, performerExternal: workshop !== null };
}
