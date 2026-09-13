"use client";

import Image from "next/image";
import { scoreColor } from "@/lib/ui";
import { tierForScore } from "@/lib/tiers";

export interface LarpCardData {
  username: string;
  avatarUrl?: string | null;
  score: number;
  tier?: string;
  stats: { label: string; value: number }[];
  achievement?: { icon: string; name: string } | null;
  xp?: number;
}

export function LarpCard({ data, className = "" }: { data: LarpCardData; className?: string }) {
  const tier = tierForScore(data.score);
  const color = scoreColor(data.score);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-edge bg-ink-2 p-6 ${className}`}
    >
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-hot/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-grape/20 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="title-display text-lg">
            <span className="text-hot">LARP</span>INATOR
          </span>
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            certified larp report
          </span>
        </div>

        <div className="flex items-center gap-4">
          {data.avatarUrl ? (
            <span className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-hot/50">
              <Image src={data.avatarUrl} alt={data.username} fill className="object-cover" sizes="64px" />
            </span>
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-panel-2 text-3xl ring-2 ring-hot/50">
              🧢
            </span>
          )}
          <div>
            <p className="title-display text-2xl break-all">{data.username.toUpperCase()}</p>
            <p className="font-mono text-xs" style={{ color }}>
              {tier.emoji} {data.tier ?? tier.name}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span
            className="title-display text-6xl leading-none"
            style={{ color, textShadow: `0 0 30px ${color}77` }}
          >
            {Math.round(data.score)}
          </span>
          <span className="title-display mb-1 text-xl text-muted">/100</span>
          <span className="mb-1.5 ml-auto font-mono text-[10px] tracking-widest text-muted uppercase">
            larp score
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {data.stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 font-mono text-[10px] tracking-wider text-muted uppercase">
                {stat.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, stat.value))}%`,
                    background: `linear-gradient(90deg, ${scoreColor(stat.value)}55, ${scoreColor(stat.value)})`,
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-xs font-bold">
                {Math.round(stat.value)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-edge/70 pt-4">
          {data.achievement ? (
            <span className="font-mono text-xs text-amber">
              {data.achievement.icon} {data.achievement.name}
            </span>
          ) : (
            <span className="font-mono text-xs text-muted">no achievements yet… concerning</span>
          )}
          {typeof data.xp === "number" && (
            <span className="font-mono text-xs text-muted">{data.xp} XP</span>
          )}
        </div>
      </div>
    </div>
  );
}

function drawCard(canvas: HTMLCanvasElement, data: LarpCardData) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#07070d";
  ctx.fillRect(0, 0, W, H);

  const glow = (x: number, y: number, r: number, color: string) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  };
  glow(W * 0.15, H * 0.02, 800, "rgba(255,45,120,0.35)");
  glow(W * 0.95, H * 0.25, 700, "rgba(168,85,247,0.3)");

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  const display = "bold 52px Arial";
  ctx.font = display;
  ctx.fillStyle = "#ff2d78";
  ctx.fillText("LARP", 84, 150);
  const larpWidth = ctx.measureText("LARP").width;
  ctx.fillStyle = "#ffffff";
  ctx.fillText("INATOR", 84 + larpWidth + 4, 150);

  ctx.font = "26px Consolas, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("CERTIFIED LARP REPORT", 84, 205);

  ctx.font = "bold 92px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(data.username.toUpperCase().slice(0, 16), 84, 360);

  const color = scoreColor(data.score);
  ctx.font = "bold 280px Arial";
  ctx.fillStyle = color;
  ctx.shadowColor = `${color}99`;
  ctx.shadowBlur = 60;
  ctx.fillText(String(Math.round(data.score)), 78, 700);
  ctx.shadowBlur = 0;
  ctx.font = "bold 72px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("/100", 84 + ctx.measureText(String(Math.round(data.score))).width + 330, 700);

  const tier = tierForScore(data.score);
  ctx.font = "bold 64px Arial";
  ctx.fillStyle = color;
  ctx.fillText(`${tier.emoji} ${data.tier ?? tier.name}`, 84, 820);

  ctx.font = "26px Consolas, monospace";
  data.stats.slice(0, 3).forEach((stat, i) => {
    const y = 960 + i * 96;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(stat.label.toUpperCase(), 84, y);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Consolas, monospace";
    ctx.fillText(String(Math.round(stat.value)), 380, y);
    ctx.font = "26px Consolas, monospace";
    const barColor = scoreColor(stat.value);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(470, y - 24, 500, 30);
    ctx.fillStyle = barColor;
    ctx.fillRect(470, y - 24, (Math.max(0, Math.min(100, stat.value)) / 100) * 500, 30);
  });

  ctx.font = "28px Consolas, monospace";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("the internet's bullshit detector", 84, H - 80);

  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#ff2d78";
  ctx.fillText("GET LARPed", W - 340, H - 80);
}

export function DownloadCardButton({ data, className = "btn-hot" }: { data: LarpCardData; className?: string }) {
  const download = () => {
    const canvas = document.createElement("canvas");
    drawCard(canvas, data);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `larpinator-${data.username}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <button type="button" onClick={download} className={className}>
      🖼️ Download card
    </button>
  );
}
