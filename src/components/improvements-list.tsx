export function ImprovementsList({ improvements }: { improvements: string[] }) {
  if (improvements.length === 0) return null;

  return (
    <div className="panel p-5 sm:p-6">
      <h3 className="title-display mb-1 text-xl">LEVEL-UP GUIDE</h3>
      <p className="mb-4 font-mono text-xs text-muted">
        How to LARP harder — and how to actually get better.
      </p>
      <ul className="flex flex-col gap-3">
        {improvements.map((item, i) => (
          <li key={i} className="panel-2 flex gap-3 p-3.5 text-sm leading-relaxed">
            <span className="mt-0.5">{item.startsWith("🪄") ? "🪄" : item.startsWith("🧠") ? "🧠" : "•"}</span>
            <span>{item.replace(/^🪄\s*LARP harder:\s*/i, "").replace(/^🧠\s*Actually improve:\s*/i, "")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
