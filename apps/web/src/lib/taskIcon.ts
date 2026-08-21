import {
  BatteryCharging,
  CircleDot,
  ClipboardCheck,
  Cog,
  Droplet,
  Filter,
  Gauge,
  RotateCw,
  Thermometer,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/* maintenance_tasks holds a name and nothing else — no icon column — and
 * the list is edited per organization, so the name is all there is to go
 * on. Matching keywords gives the mockup's variety without inventing a
 * column, and anything unrecognised falls back to the wrench rather than
 * guessing. Spanish included: the task list is the coordinator's to write.
 *
 * If this ever needs to be exact, the fix is an icon column on
 * maintenance_tasks, not a longer list here. */
const KEYWORDS: [RegExp, LucideIcon][] = [
  [/oil|aceite|lubric/i, Droplet],
  [/brake|freno|pastilla/i, CircleDot],
  [/t[iy]re|llanta|neum|rotation|rotaci/i, RotateCw],
  [/clutch|embrague|transmis|gear|caja/i, Cog],
  [/batter|bater[ií]a|altern/i, BatteryCharging],
  [/filter|filtro/i, Filter],
  [/coolant|refriger|radiator|radiador|temperat/i, Thermometer],
  [/air|aire|a\/c|clima/i, Wind],
  [/inspect|revis|check|chequeo/i, ClipboardCheck],
  [/aline|align|suspens|odomet|km/i, Gauge],
]

export function taskIcon(taskName: string): LucideIcon {
  return KEYWORDS.find(([pattern]) => pattern.test(taskName))?.[1] ?? Wrench
}
