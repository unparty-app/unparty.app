import type { RepositoryMetadata } from '@/types/repository-metadata'

let cached: Promise<RepositoryMetadata[]> | null = null

/** Module-level singleton fetch of `/raw-repo-metadata.json`, shared across
 *  every client component that needs the full raw dataset (rather than the
 *  statically-bundled aggregate in unpppTimeline.ts). Reused across mounts
 *  and SPA navigations within a session instead of re-fetching + re-parsing
 *  the same ~130KB file each time. */
export function getRepoMetadata(): Promise<RepositoryMetadata[]> {
  if (!cached) {
    cached = fetch('/raw-repo-metadata.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch repository data: ${res.status}`)
        return res.json() as Promise<RepositoryMetadata[]>
      })
      .catch(err => {
        cached = null
        throw err
      })
  }
  return cached
}
