const GITHUB_API = "https://api.github.com";
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const CACHE_TTL_MS = 30 * 60 * 1000;
const DEEP_SCAN_LIMIT = 10;
const CONCURRENCY = 4;

export class GitHubNotFoundError extends Error {
  constructor(message = "GitHub user or repository not found.") {
    super(message);
    this.name = "GitHubNotFoundError";
  }
}

/** Accepts a username or a github.com URL and returns a validated username. */
export function parseGitHubUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)\/?$/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;
  if (candidate.endsWith(".git")) return null;
  return USERNAME_RE.test(candidate) ? candidate : null;
}

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
  avatar_url: string;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  owner: { login: string };
}

interface GitHubContributor {
  login?: string;
  contributions: number;
}

interface GitHubEvent {
  type: string | null;
  created_at: string | null;
}

interface GitHubCommit {
  commit: { author: { date: string | null } | null };
}

const cache = new Map<string, { expires: number; data: unknown }>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function githubFetch<T>(path: string, opts?: { raw?: boolean }): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.data as T;

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: opts?.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Larpinator/1.0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${GITHUB_API}${path}`, { headers, cache: "no-store" });

    if (response.status === 403 || response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const reset = Number(response.headers.get("x-ratelimit-reset") ?? 0);
      const waitMs =
        retryAfter > 0 ? retryAfter * 1000 : reset > 0 ? reset * 1000 - Date.now() + 500 : 0;
      if (attempt < 2 && waitMs > 0 && waitMs <= 20_000) {
        await sleep(waitMs);
        continue;
      }
      throw new Error("GitHub rate limit reached. Wait a minute and try again.");
    }

    if (response.status === 404) {
      throw new GitHubNotFoundError();
    }
    if (!response.ok) {
      throw new Error(`GitHub API error (${response.status}).`);
    }

    const data = opts?.raw ? await response.text() : await response.json();
    cache.set(path, { expires: Date.now() + CACHE_TTL_MS, data });
    return data as T;
  }

  throw new Error("GitHub rate limit reached. Wait a minute and try again.");
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchAllRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const batch = await githubFetch<GitHubRepo[]>(
      `/users/${username}/repos?per_page=100&page=${page}&sort=pushed`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

const BUZZWORDS = [
  "ai-powered",
  "ai powered",
  "machine learning",
  "deep learning",
  "blockchain",
  "web3",
  "scalable",
  "distributed",
  "production-grade",
  "production ready",
  "enterprise",
  "cutting-edge",
  "next-generation",
  "revolutionary",
  "seamless",
  "robust",
  "cloud-native",
  "microservices",
  "high-performance",
  "real-time",
  "state-of-the-art",
  "game-changing",
  "disruptive",
  "synergy",
  "leverage",
  "world-class",
  "battle-tested",
  "self-taught",
];

function countBuzzwords(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const word of BUZZWORDS) {
    let count = 0;
    let pos = 0;
    while ((pos = lower.indexOf(word, pos)) !== -1) {
      count++;
      pos += word.length;
    }
    if (count > 0) counts[word] = count;
  }
  return counts;
}

function daysAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

interface RepoEvidence {
  name: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  size_kb: number;
  created_at: string;
  pushed_at: string;
  days_since_push: number | null;
  user_commits: number;
  user_commits_last_year: number;
  user_active_months: number;
  user_is_contributor: boolean;
  user_contribution_share: number | null;
  readme_length: number;
  readme_excerpt: string;
  readme_buzzwords: Record<string, number>;
  languages: Record<string, number>;
}

async function deepScanRepo(username: string, repo: GitHubRepo): Promise<RepoEvidence> {
  const full = repo.full_name;

  const [languages, readme, contributors, commits] = await Promise.all([
    githubFetch<Record<string, number>>(`/repos/${full}/languages`).catch(() => ({})),
    githubFetch<string>(`/repos/${full}/readme`, { raw: true }).catch(() => ""),
    githubFetch<GitHubContributor[]>(`/repos/${full}/contributors?per_page=100`).catch(
      () => [] as GitHubContributor[],
    ),
    githubFetch<GitHubCommit[]>(`/repos/${full}/commits?author=${username}&per_page=100`).catch(
      () => [] as GitHubCommit[],
    ),
  ]);

  const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  const languageShare: Record<string, number> = {};
  if (totalBytes > 0) {
    for (const [lang, bytes] of Object.entries(languages)) {
      languageShare[lang] = Math.round((bytes / totalBytes) * 1000) / 1000;
    }
  }

  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const commitDates = commits
    .map((c) => c.commit?.author?.date)
    .filter((d): d is string => Boolean(d));
  const commitsLastYear = commitDates.filter((d) => new Date(d).getTime() >= yearAgo).length;
  const activeMonths = new Set(commitDates.map((d) => d.slice(0, 7))).size;

  const contributorEntry = contributors.find((c) => c.login?.toLowerCase() === username.toLowerCase());
  const totalContributions = contributors.reduce((sum, c) => sum + (c.contributions ?? 0), 0);
  const contributionShare =
    contributorEntry && totalContributions > 0
      ? Math.round((contributorEntry.contributions / totalContributions) * 1000) / 1000
      : null;

  const readmeText = typeof readme === "string" ? readme : "";

  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: repo.topics ?? [],
    size_kb: repo.size,
    created_at: repo.created_at,
    pushed_at: repo.pushed_at,
    days_since_push: daysAgo(repo.pushed_at),
    user_commits: commits.length,
    user_commits_last_year: commitsLastYear,
    user_active_months: activeMonths,
    user_is_contributor: Boolean(contributorEntry),
    user_contribution_share: contributionShare,
    readme_length: readmeText.length,
    readme_excerpt: readmeText.slice(0, 1500),
    readme_buzzwords: countBuzzwords(readmeText),
    languages: languageShare,
  };
}

export interface GitHubEvidence {
  profile: {
    username: string;
    name: string | null;
    bio: string | null;
    company: string | null;
    blog: string | null;
    account_age_years: number;
    followers: number;
    following: number;
    public_repos: number;
    public_gists: number;
  };
  repositories: {
    total: number;
    original: number;
    forked: number;
    fork_ratio: number;
    active_last_year: number;
    without_description: number;
    top_starred: { name: string; stars: number; forks: number; language: string | null }[];
  };
  languages: Record<string, number>;
  activity: {
    commits_last_year: number;
    active_months_last_year: number;
    events_last_30_days: number;
    scanned_repos: number;
  };
  deep_scanned_repos: RepoEvidence[];
}

export async function fetchGitHubEvidence(username: string): Promise<GitHubEvidence> {
  const user = await githubFetch<GitHubUser>(`/users/${username}`);
  const repos = await fetchAllRepos(username);

  const originals = repos.filter((r) => !r.fork);
  const forked = repos.filter((r) => r.fork);
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  const ranked = [...originals].sort((a, b) => {
    const score = (r: GitHubRepo) => {
      const recency = new Date(r.pushed_at).getTime();
      const recencyBonus = recency >= yearAgo ? 8 : 0;
      return r.stargazers_count * 4 + r.forks_count * 2 + recencyBonus + Math.min(r.size, 20000) / 4000;
    };
    return score(b) - score(a);
  });

  const selected = ranked.slice(0, DEEP_SCAN_LIMIT);
  const deepScanned = await mapLimit(selected, CONCURRENCY, (repo) => deepScanRepo(username, repo));

  const events = await githubFetch<GitHubEvent[]>(`/users/${username}/events/public?per_page=100`).catch(
    () => [] as GitHubEvent[],
  );
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const eventsLast30 = events.filter(
    (e) => e.created_at && new Date(e.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const languageBytes: Record<string, number> = {};
  for (const repo of deepScanned) {
    for (const [lang, share] of Object.entries(repo.languages)) {
      languageBytes[lang] = (languageBytes[lang] ?? 0) + share;
    }
  }
  const totalShare = Object.values(languageBytes).reduce((sum, v) => sum + v, 0);
  const languages: Record<string, number> = {};
  for (const [lang, share] of Object.entries(languageBytes)) {
    languages[lang] = Math.round((share / totalShare) * 100) / 100;
  }

  const accountAgeYears =
    Math.round(((Date.now() - new Date(user.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;

  const commitsLastYear = deepScanned.reduce((sum, r) => sum + r.user_commits_last_year, 0);
  const activeMonths = new Set(
    deepScanned.flatMap((r) => (r.user_active_months > 0 ? [r.user_active_months] : [])),
  );

  return {
    profile: {
      username: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      blog: user.blog,
      account_age_years: accountAgeYears,
      followers: user.followers,
      following: user.following,
      public_repos: user.public_repos,
      public_gists: user.public_gists,
    },
    repositories: {
      total: repos.length,
      original: originals.length,
      forked: forked.length,
      fork_ratio: repos.length > 0 ? Math.round((forked.length / repos.length) * 100) / 100 : 0,
      active_last_year: originals.filter((r) => new Date(r.pushed_at).getTime() >= yearAgo).length,
      without_description: repos.filter((r) => !r.description).length,
      top_starred: [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map((r) => ({
          name: r.name,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
        })),
    },
    languages,
    activity: {
      commits_last_year: commitsLastYear,
      active_months_last_year: Math.max(activeMonths.size, ...deepScanned.map((r) => r.user_active_months), 0),
      events_last_30_days: eventsLast30,
      scanned_repos: deepScanned.length,
    },
    deep_scanned_repos: deepScanned,
  };
}
