import { useQuery } from '@tanstack/react-query'

type HealthResponse = {
  status: 'ok' | 'error' | 'shutting_down'
  details: Record<string, { status: 'up' | 'down' }>
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  // terminus answers 503 when a dependency is down, and the body still
  // carries the detail, so read it either way
  const body = (await res.json()) as HealthResponse
  return body
}

function Dot({ up }: { up: boolean }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${up ? 'bg-on-track' : 'bg-overdue'}`}
    />
  )
}

export default function App() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  })

  const apiUp = !isError && !isPending && data?.status === 'ok'
  const dbUp = data?.details?.database?.status === 'up'

  return (
    <main className="min-h-screen bg-page text-ink">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6">
        <header>
          <p className="text-sm font-medium tracking-widest text-lime uppercase">
            Vehicle Maintenance Tracking
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Scaffolding is up</h1>
          <p className="mt-2 text-ink-muted">
            React, NestJS, PostgreSQL and Tailwind are wired together. No features yet.
          </p>
        </header>

        <section className="rounded-xl border border-white/10 bg-panel p-5">
          <h2 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            Connection
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Web client</dt>
              <dd className="flex items-center gap-2">
                <Dot up /> running
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">API</dt>
              <dd className="flex items-center gap-2">
                {isPending ? (
                  <span className="text-ink-muted">checking…</span>
                ) : (
                  <>
                    <Dot up={apiUp} /> {apiUp ? 'reachable' : 'unreachable'}
                  </>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Database</dt>
              <dd className="flex items-center gap-2">
                {isPending ? (
                  <span className="text-ink-muted">checking…</span>
                ) : (
                  <>
                    <Dot up={dbUp} /> {dbUp ? 'connected' : 'down'}
                  </>
                )}
              </dd>
            </div>
          </dl>
          {!isPending && !dbUp && (
            <p className="mt-4 border-t border-white/10 pt-4 text-sm text-due-soon">
              Start Postgres with <code className="text-ink">pnpm db:up</code>.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
