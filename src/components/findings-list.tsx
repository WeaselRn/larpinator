import type { Finding } from "@/lib/types";

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;

  return (
    <div className="panel p-5 sm:p-6">
      <h3 className="title-display mb-4 text-xl">EVIDENCE BOARD</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {findings.map((finding, i) => (
          <div key={i} className="panel-2 flex flex-col gap-2.5 p-4">
            <span className="font-mono text-xs tracking-widest text-hot uppercase">
              Receipt #{i + 1}
            </span>
            <h4 className="font-bold">{finding.title}</h4>
            <p className="rounded-lg border border-edge bg-ink-2 px-3 py-2 font-mono text-xs leading-relaxed text-muted">
              {finding.evidence}
            </p>
            <p className="text-sm leading-relaxed">💬 {finding.roast}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
