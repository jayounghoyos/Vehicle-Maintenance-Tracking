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
