import { scoreColor } from "@/lib/ui";

export interface HistoryPoint {
  score: number;
  created_at: string;
  type: string;
}

export function HistoryGraph({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="panel flex h-44 items-center justify-center p-6 text-center">
        <p className="font-mono text-xs text-muted">
          Not enough history to draw a graph. Complete more analyses — your descent into main-character energy will
          be charted here.
        </p>
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const padding = 12;

  const sorted = [...points].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const xs = sorted.map((p) => new Date(p.created_at).getTime());
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const spanX = maxX - minX || 1;

  const coords = sorted.map((point) => {
    const x = padding + ((new Date(point.created_at).getTime() - minX) / spanX) * (width - padding * 2);
    const y = height - padding - (Math.max(0, Math.min(100, point.score)) / 100) * (height - padding * 2);
    return { x, y, score: point.score, type: point.type };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${coords[coords.length - 1].x.toFixed(1)},${height - padding} L${coords[0].x.toFixed(1)},${height - padding} Z`;

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="title-display text-xl">LARP HISTORY</h3>
        <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
          larp over time
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2d78" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff2d78" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((line) => {
          const y = height - padding - (line / 100) * (height - padding * 2);
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#2a2a3f"
              strokeDasharray="4 6"
            />
          );
        })}
        <path d={areaPath} fill="url(#historyFill)" />
        <path d={path} fill="none" stroke="#ff2d78" strokeWidth="2.5" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={scoreColor(c.score)} />
        ))}
      </svg>
    </div>
  );
}
