"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AUDIO_TRACKS } from "@/lib/reactions";

interface AudioManagerValue {
  /** Plays a random track from the pool. `force` bypasses the ambient cooldown. */
  playRandom: (opts?: { force?: boolean }) => void;
  muted: boolean;
  toggleMuted: () => void;
}

const FALLBACK: AudioManagerValue = {
  playRandom: () => {},
  muted: false,
  toggleMuted: () => {},
};

const AudioManagerContext = createContext<AudioManagerValue | null>(null);

const AMBIENT_COOLDOWN_MS = 15_000;
const FORCE_MIN_GAP_MS = 1_200;
const AMBIENT_INTERVAL_MS = 75_000;
const VOLUME = 0.55;
const STORAGE_KEY = "larpinator:muted";

/** Reads the persisted mute preference. Server render always starts unmuted. */
function readStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AudioManagerProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(readStoredMuted);
  const mutedRef = useRef(muted);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayRef = useRef(0);

  const playRandom = useCallback((opts?: { force?: boolean }) => {
    if (mutedRef.current) return;

    const now = Date.now();
    const gap = now - lastPlayRef.current;
    if (opts?.force) {
      if (gap < FORCE_MIN_GAP_MS) return;
    } else if (gap < AMBIENT_COOLDOWN_MS) {
      return;
    }
    lastPlayRef.current = now;

    try {
      let element = audioRef.current;
      if (!element) {
        element = new Audio();
        element.preload = "auto";
        element.volume = VOLUME;
        audioRef.current = element;
      }
      element.src = AUDIO_TRACKS[Math.floor(Math.random() * AUDIO_TRACKS.length)];
      element.currentTime = 0;
      element.play().catch(() => {
        /* autoplay blocked until first interaction — fine */
      });
    } catch {
      /* audio unavailable */
    }
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((previous) => {
      const next = !previous;
      mutedRef.current = next;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      if (next) {
        audioRef.current?.pause();
      }
      return next;
    });
  }, []);

  return (
    <AudioManagerContext.Provider value={{ playRandom, muted, toggleMuted }}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useAudioManager(): AudioManagerValue {
  return useContext(AudioManagerContext) ?? FALLBACK;
}

/** Routes that are "activities" — navigating to them always triggers a sound. */
const ACTIVITY_ROUTES = ["/analyze", "/battle", "/quiz", "/daily"];

/** Ambient playback: random sounds on navigation and every ~75s while visible. */
export function AmbientAudio() {
  const { playRandom } = useAudioManager();
  const pathname = usePathname();

  useEffect(() => {
    const isActivity = ACTIVITY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    playRandom({ force: isActivity });
  }, [pathname, playRandom]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        playRandom();
      }
    }, AMBIENT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [playRandom]);

  return null;
}

export function AudioToggle({ className = "btn-ghost !px-3 !py-2" }: { className?: string }) {
  const { muted, toggleMuted } = useAudioManager();
  return (
    <button
      type="button"
      onClick={toggleMuted}
      className={className}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Unmute sounds" : "Mute sounds"}
      suppressHydrationWarning
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
