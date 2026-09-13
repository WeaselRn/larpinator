const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const USERNAME_RE = /^[a-zA-Z0-9._-]{2,30}$/;
const CACHE_TTL_MS = 30 * 60 * 1000;

export class LastfmNotFoundError extends Error {
  constructor(message = "Last.fm user not found. Check the username — or accept that the scrobbles don't exist.") {
    super(message);
    this.name = "LastfmNotFoundError";
  }
}

export function parseLastfmUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?last\.fm\/user\/([^/?#\s]+)\/?$/i);
  const candidate = urlMatch ? urlMatch[1] : trimmed;
  return USERNAME_RE.test(candidate) ? candidate : null;
}

const cache = new Map<string, { expires: number; data: unknown }>();

async function lastfmFetch<T>(method: string, params: Record<string, string>): Promise<T> {
  const apiKey = process.env.LASTFM_API_KEY ?? process.env.LASTFM_API;
  if (!apiKey) {
    throw new Error("LASTFM_API_KEY is missing. Add it to .env (server-side only) or we can't read your scrobbles.");
  }

  const query = new URLSearchParams({ method, api_key: apiKey, format: "json", ...params });
  const cacheKey = query.toString().replace(apiKey, "***");

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.data as T;

  const response = await fetch(`${LASTFM_BASE}?${query}`, {
    headers: { "User-Agent": "Larpinator/1.0 (larpinator.app)" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Last.fm API error (${response.status}).`);
  }

  const json = (await response.json()) as { error?: number; message?: string };
  if (json.error) {
    if (json.error === 6) throw new LastfmNotFoundError();
    if (json.error === 10) throw new Error("Last.fm rejected the API key (10). Check LASTFM_API_KEY before we can't judge your top artists.");
    if (json.error === 29) throw new Error("Last.fm rate limit reached (29). The music judge needs a moment. Try again shortly.");
    throw new Error(`Last.fm error ${json.error}: ${json.message ?? "unknown"}`);
  }

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: json });
  return json as T;
}

interface TopArtist {
  name: string;
  playcount: string;
  url?: string;
}
interface TopAlbum {
  name: string;
  playcount: string;
  artist: { name: string };
}
interface TopTrack {
  name: string;
  playcount: string;
  artist: { name: string };
}
interface TopTag {
  name: string;
  count: string;
}
interface LovedTrack {
  name: string;
  artist: { name: string };
}
interface RecentTrack {
  name: string;
  artist: { "#text": string };
  date?: { uts: string };
  "@attr"?: { nowplaying?: string };
}

export interface MusicEvidence {
  username: string;
  top_artists: { name: string; playcount: number; share: number }[];
  top_albums: { artist: string; name: string; playcount: number }[];
  top_tracks: { artist: string; name: string; playcount: number }[];
  top_tags: { name: string; count: number }[];
  loved: { count: number; sample: { artist: string; name: string }[] };
  recent: {
    tracks: number;
    unique_artists: number;
    first_played: string | null;
    last_played: string | null;
    tracks_per_day: number | null;
  };
  diversity: {
    unique_artists_top50: number;
    top_artist_share: number;
    top5_share: number;
    tag_count: number;
  };
  personal_tags: { tag: string; count: number; sample: string[] } | null;
}

const toNumber = (value: string | number | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export async function fetchMusicEvidence(username: string): Promise<MusicEvidence> {
  const [topArtistsRes, topAlbumsRes, topTracksRes, topTagsRes, lovedRes, recentRes] = await Promise.all([
    lastfmFetch<{ topartists: { artist?: TopArtist[] } }>("user.gettopartists", {
      user: username,
      period: "overall",
      limit: "50",
      page: "1",
    }),
    lastfmFetch<{ topalbums: { album?: TopAlbum[] } }>("user.gettopalbums", {
      user: username,
      period: "overall",
      limit: "50",
      page: "1",
    }),
    lastfmFetch<{ toptracks: { track?: TopTrack[] } }>("user.gettoptracks", {
      user: username,
      period: "overall",
      limit: "50",
      page: "1",
    }),
    lastfmFetch<{ toptags: { tag?: TopTag[] } }>("user.gettoptags", {
      user: username,
      limit: "50",
    }),
    lastfmFetch<{ lovedtracks: { track?: LovedTrack[] } }>("user.getlovedtracks", {
      user: username,
      limit: "50",
      page: "1",
    }),
    lastfmFetch<{ recenttracks: { track?: RecentTrack[] } }>("user.getrecenttracks", {
      user: username,
      limit: "200",
      page: "1",
    }),
  ]);

  const artists = topArtistsRes.topartists?.artist ?? [];
  const albums = topAlbumsRes.topalbums?.album ?? [];
  const tracks = topTracksRes.toptracks?.track ?? [];
  const tags = topTagsRes.toptags?.tag ?? [];
  const loved = lovedRes.lovedtracks?.track ?? [];
  const recent = recentRes.recenttracks?.track ?? [];

  const totalArtistPlays = artists.reduce((sum, a) => sum + toNumber(a.playcount), 0);
  const topArtistPlays = toNumber(artists[0]?.playcount);
  const top5Plays = artists.slice(0, 5).reduce((sum, a) => sum + toNumber(a.playcount), 0);

  const recentDated = recent.filter((t) => t.date?.uts);
  const recentUts = recentDated.map((t) => Number(t.date?.uts)).filter((n) => Number.isFinite(n));
  const firstPlayed = recentUts.length > 0 ? new Date(Math.min(...recentUts) * 1000).toISOString() : null;
  const lastPlayed = recentUts.length > 0 ? new Date(Math.max(...recentUts) * 1000).toISOString() : null;
  const spanDays =
    recentUts.length > 1 ? (Math.max(...recentUts) - Math.min(...recentUts)) / 86400 : null;

  let personalTags: MusicEvidence["personal_tags"] = null;
  const topTag = tags[0]?.name;
  if (topTag) {
    try {
      const personalRes = await lastfmFetch<{
        personaltags: { artists?: { artist?: { name: string }[] } };
      }>("user.getpersonaltags", {
        user: username,
        tag: topTag,
        taggingtype: "artist",
        limit: "50",
        page: "1",
      });
      const taggedArtists = personalRes.personaltags?.artists?.artist ?? [];
      personalTags = {
        tag: topTag,
        count: taggedArtists.length,
        sample: taggedArtists.slice(0, 10).map((a) => a.name),
      };
    } catch {
      personalTags = null;
    }
  }

  return {
    username,
    top_artists: artists.slice(0, 20).map((a) => ({
      name: a.name,
      playcount: toNumber(a.playcount),
      share: totalArtistPlays > 0 ? Math.round((toNumber(a.playcount) / totalArtistPlays) * 1000) / 1000 : 0,
    })),
    top_albums: albums.slice(0, 10).map((a) => ({
      artist: a.artist?.name ?? "?",
      name: a.name,
      playcount: toNumber(a.playcount),
    })),
    top_tracks: tracks.slice(0, 10).map((t) => ({
      artist: t.artist?.name ?? "?",
      name: t.name,
      playcount: toNumber(t.playcount),
    })),
    top_tags: tags.slice(0, 20).map((t) => ({ name: t.name, count: toNumber(t.count) })),
    loved: {
      count: loved.length,
      sample: loved.slice(0, 10).map((t) => ({ artist: t.artist?.name ?? "?", name: t.name })),
    },
    recent: {
      tracks: recent.length,
      unique_artists: new Set(recent.map((t) => t.artist?.["#text"] ?? "?")).size,
      first_played: firstPlayed,
      last_played: lastPlayed,
      tracks_per_day: spanDays && spanDays > 0 ? Math.round((recent.length / spanDays) * 10) / 10 : null,
    },
    diversity: {
      unique_artists_top50: new Set(artists.map((a) => a.name)).size,
      top_artist_share: totalArtistPlays > 0 ? Math.round((topArtistPlays / totalArtistPlays) * 1000) / 1000 : 0,
      top5_share: totalArtistPlays > 0 ? Math.round((top5Plays / totalArtistPlays) * 1000) / 1000 : 0,
      tag_count: tags.length,
    },
    personal_tags: personalTags,
  };
}
