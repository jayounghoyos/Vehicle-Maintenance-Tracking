/** 128450 -> "128,450" */
export function odometer(km: number): string {
  return km.toLocaleString('en-US')
}

/** "2026-07-28" -> "28 Jul 2026" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "2026-08-09" -> "Sunday, 9 August 2026" */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "Ana Restrepo" -> "AR" */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** user_role in the data model -> what the sidebar shows */
export function roleLabel(role: string): string {
  return role
    .split('_')
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ')
}

/** "2 days ago" / "1 week ago" — coarse on purpose, like the mockup */
export function relativeDay(iso: string, today: Date = new Date()): string {
  const MS_PER_DAY = 86_400_000
  const days = Math.round((today.getTime() - new Date(iso).getTime()) / MS_PER_DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}
