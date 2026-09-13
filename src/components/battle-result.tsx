import Link from "next/link";
import type { BattlePlayerResult } from "@/lib/ai-schemas";
import { categoryEmoji, categoryLabel } from "@/lib/categories";
import type { Achievement, Finding, Profile } from "@/lib/types";
import { scoreColor } from "@/lib/ui";
import { AUDIO_CUES } from "@/lib/reactions";
import { AchievementBanner } from "./analysis-result";
import { AudioReaction } from "./audio-reaction";
import { FindingsList } from "./findings-list";
import { MemeReaction } from "./meme-reaction";
import { ShareButton } from "./share-button";
import { TierBadge } from "./tier-badge";

export interface BattleResponse {
  result: {
    playerOne: BattlePlayerResult;
    playerTwo: BattlePlayerResult;
    verdict: string;
    findings: Finding[];
  };
  battle: {
    id: string;
    winner: "player_one" | "player_two" | null;
    playerOneName: string;
    playerTwoName: string;
  };
  profile: Profile;
  newAchievements: Achievement[];
}

const METRICS = ["buzzword", "fakeness", "cringe", "aura", "substance"] as const;

function betterValue(metric: string, a: number, b: number): "a" | "b" | "tie" {
  if (a === b) return "tie";
  const higherIsBetter = metric === "aura";
  if (higherIsBetter) return a > b ? "a" : "b";
  return a < b ? "a" : "b";
}

function PlayerRoast({
  name,
  player,
  isWinner,
}: {
  name: string;
  player: BattlePlayerResult;
  isWinner: boolean;
}) {
  return (
    <div className={`panel p-5 ${isWinner ? "border-lime/50" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="title-display text-xl break-all">
          {name}
          {isWinner && <span className="ml-2 text-sm text-lime">🏆 winner</span>}
        </p>
        <span
          className="title-display text-3xl"
          style={{ color: scoreColor(player.overall_score) }}
        >
          {Math.round(player.overall_score)}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">🔥 {player.roast}</p>
    </div>
  );
}

export function BattleResultView({ data }: { data: BattleResponse }) {
  const { playerOne, playerTwo, verdict, findings } = data.result;
  const winner = data.battle.winner;

  return (
    <div className="animate-rise flex flex-col gap-6">
      {/* Winner banner */}
      <div className="panel relative overflow-hidden p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-hot/15 blur-3xl" />
        <span className="chip">⚔️ battle result</span>
        <h2 className="title-display mt-4 text-4xl sm:text-5xl">
          {winner === null ? (
            <span className="text-amber">🤝 IT&apos;S A DRAW</span>
          ) : (
            <>
              🏆 WINNER:{" "}
              <span className="text-lime">
                {winner === "player_one" ? data.battle.playerOneName : data.battle.playerTwoName}
              </span>
            </>
          )}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">{verdict}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <AudioReaction src={AUDIO_CUES.battle} autoPlay label="Battle sound" />
          <ShareButton
            url={`/card/${data.profile.username}`}
            text={`⚔️ LARP battle: ${data.battle.playerOneName} ${Math.round(playerOne.overall_score)} vs ${data.battle.playerTwoName} ${Math.round(playerTwo.overall_score)}. Get LARPed:`}
            label="Share the battle"
            className="btn-hot"
          />
          <Link href="/battle" className="btn-ghost">
            ⚔️ Rematch
          </Link>
        </div>
      </div>

      <AchievementBanner achievements={data.newAchievements} />

      {/* Score table */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-0 border-b border-edge/70 px-5 py-4 font-mono text-xs tracking-widest text-muted uppercase sm:grid-cols-[1.4fr_1fr_1fr]">
          <span>metric</span>
          <span className="text-center">{data.battle.playerOneName}</span>
          <span className="text-center">{data.battle.playerTwoName}</span>
        </div>
        {METRICS.map((metric) => {
          const a = playerOne.categories[metric] ?? 0;
          const b = playerTwo.categories[metric] ?? 0;
          const better = betterValue(metric, a, b);
          return (
            <div
              key={metric}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-edge/40 px-5 py-3 sm:grid-cols-[1.4fr_1fr_1fr]"
            >
              <span className="text-sm font-semibold">
                {categoryEmoji(metric)} {categoryLabel(metric)}
              </span>
              <span
                className={`text-center font-mono text-lg font-bold ${
                  better === "a" ? "text-lime" : ""
                }`}
                style={better === "a" ? undefined : { color: scoreColor(a) }}
              >
                {Math.round(a)}
              </span>
              <span
                className={`text-center font-mono text-lg font-bold ${
                  better === "b" ? "text-lime" : ""
                }`}
                style={better === "b" ? undefined : { color: scoreColor(b) }}
              >
                {Math.round(b)}
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 bg-panel-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr]">
          <span className="title-display text-lg">OVERALL LARP</span>
          <span
            className="title-display text-center text-3xl"
            style={{ color: scoreColor(playerOne.overall_score) }}
          >
            {Math.round(playerOne.overall_score)}
          </span>
          <span
            className="title-display text-center text-3xl"
            style={{ color: scoreColor(playerTwo.overall_score) }}
          >
            {Math.round(playerTwo.overall_score)}
          </span>
        </div>
      </div>
      <p className="text-center font-mono text-[10px] text-muted">
        Lower LARP wins. Less pretending, more substance. That&apos;s the only way to lose this
        game and still win.
      </p>

      {/* Roasts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PlayerRoast
          name={data.battle.playerOneName}
          player={playerOne}
          isWinner={winner === "player_one"}
        />
        <PlayerRoast
          name={data.battle.playerTwoName}
          player={playerTwo}
          isWinner={winner === "player_two"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MemeReaction score={playerOne.overall_score} />
        <div className="panel flex flex-col items-center justify-center gap-3 p-5">
          <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
            your battle score
          </p>
          <TierBadge score={playerOne.overall_score} size="lg" />
          <Link href="/dashboard" className="btn-ghost">
            🪪 See updated profile
          </Link>
        </div>
      </div>

      <FindingsList findings={findings} />
    </div>
  );
}
