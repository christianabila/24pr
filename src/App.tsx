import { useEffect, useMemo, useState } from 'react'
import type { Project } from './types'

const ALL = 'all'
const NONE = 'none'

function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/projects', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json() as Promise<Project[]>
      })
      .then(setProjects)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { projects, loading, error }
}

export default function App() {
  const { projects, loading, error } = useProjects()
  const [language, setLanguage] = useState<string>(ALL)
  const [search, setSearch] = useState('')

  // Distinct languages with their project counts, most common first.
  const languages = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of projects) {
      const key = p.main_language ?? NONE
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      const lang = p.main_language ?? NONE
      if (language !== ALL && lang !== language) return false
      if (!q) return true
      return (
        p.github_url.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [projects, language, search])

  return (
    <main className="container">
      <header>
        <h1>24 Pull Requests Projects</h1>
        <p className="subtitle">
          Browse open source projects and filter them by main language.
        </p>
      </header>

      <section className="controls" aria-label="Filters">
        <label>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value={ALL}>All languages ({projects.length})</option>
            {languages.map(([lang, count]) => (
              <option key={lang} value={lang}>
                {lang === NONE ? 'Unknown' : lang} ({count})
              </option>
            ))}
          </select>
        </label>

        <label className="grow">
          Search
          <input
            type="search"
            placeholder="Filter by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        {(language !== ALL || search) && (
          <button
            type="button"
            onClick={() => {
              setLanguage(ALL)
              setSearch('')
            }}
          >
            Reset
          </button>
        )}
      </section>

      {loading && <p role="status">Loading projects…</p>}
      {error && (
        <p role="alert" className="error">
          Could not load projects: {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="count" role="status">
            Showing {filtered.length} of {projects.length} projects
          </p>

          {filtered.length === 0 ? (
            <p>No projects match your filters.</p>
          ) : (
            <ul className="grid">
              {filtered.map((p) => (
                <li key={p.github_url} className="card">
                  <a href={p.github_url} target="_blank" rel="noreferrer">
                    {p.github_url.replace('https://github.com/', '')}
                  </a>
                  <p>{p.description || 'No description.'}</p>
                  <button
                    type="button"
                    className="badge"
                    onClick={() => setLanguage(p.main_language ?? NONE)}
                    title="Filter by this language"
                  >
                    {p.main_language ?? 'Unknown'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
