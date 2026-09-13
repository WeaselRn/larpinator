export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="animate-pop rounded-2xl border border-blood/50 bg-blood/10 p-5">
      <p className="font-mono text-xs tracking-widest text-blood uppercase">Analysis failed</p>
      <p className="mt-1.5 text-sm">{message}</p>
      <p className="mt-1.5 font-mono text-[10px] text-muted">
        Nothing was saved. We never fabricate results — unlike some people&apos;s CVs.
      </p>
    </div>
  );
}
