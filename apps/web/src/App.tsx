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
      className={`inline-block size-2 rounded-full ${up ? 'bg-status-on-track' : 'bg-status-overdue'}`}
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
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6">
        <header>
          <p className="text-sm font-medium tracking-widest text-brand-lime uppercase">
            Vehicle Maintenance Tracking
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Scaffolding is up</h1>
          <p className="mt-2 text-neutral-400">
            React, NestJS, PostgreSQL and Tailwind are wired together. No features yet.
          </p>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            Connection
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-400">Web client</dt>
              <dd className="flex items-center gap-2">
                <Dot up /> running
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-400">API</dt>
              <dd className="flex items-center gap-2">
                {isPending ? (
                  <span className="text-neutral-500">checking…</span>
                ) : (
                  <>
                    <Dot up={apiUp} /> {apiUp ? 'reachable' : 'unreachable'}
                  </>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-400">Database</dt>
              <dd className="flex items-center gap-2">
                {isPending ? (
                  <span className="text-neutral-500">checking…</span>
                ) : (
                  <>
                    <Dot up={dbUp} /> {dbUp ? 'connected' : 'down'}
                  </>
                )}
              </dd>
            </div>
          </dl>
          {!isPending && !dbUp && (
            <p className="mt-4 border-t border-neutral-800 pt-4 text-sm text-status-due-soon">
              Start Postgres with <code className="text-neutral-300">pnpm db:up</code>.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
