/**
 * Repo types shared with /languages (RepoCard): a repo from the
 * public/raw-repo-metadata.json snapshot, optionally decorated with the live
 * GitHub App data /api/repo-data returns. /founders itself no longer shows
 * repo data; its resume is computed from the site (./resume-data.ts).
 */
import type { RepositoryMetadata } from '@/types/repository-metadata';

/** One repo as /api/repo-data returns it */
export interface RepositoryData {
  id: number;
  repoName: string;
  fullName: string;
  description: string;
  language: string;
  languages: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  branch: string;
  forks: number;
  watchers: number;
  stars: number;
  preview?: string;
  url: string;
  isPrivate: boolean;
  pushedAt: string;
  latestRelease?: {
    id: number;
    tagName: string;
    name: string;
    publishedAt: string;
    createdAt: string;
    isDraft: boolean;
    isPrerelease: boolean;
    htmlUrl: string;
  };
  totalReleases: number;
  customProperties?: Array<{
    propertyName: string;
    value: string;
  }>;
}

/** A repo from the raw snapshot, optionally decorated with live API data */
export interface MergedRepo {
  meta: RepositoryMetadata;
  live?: RepositoryData;
}
