export function DbNotice({ message }: { message?: string }) {
  return (
    <div className="panel mx-auto my-16 flex max-w-2xl flex-col gap-3 p-8">
      <span className="text-4xl">🧱</span>
      <h2 className="title-display text-2xl">DATABASE NOT READY</h2>
      <p className="text-sm text-muted">
        The Supabase schema hasn&apos;t been set up yet. In the Supabase Dashboard → SQL Editor,
        run these two files in order:
      </p>
      <ol className="flex flex-col gap-1.5 font-mono text-xs text-muted">
        <li>1. supabase/migrations/001_schema.sql</li>
        <li>2. supabase/migrations/002_seed.sql</li>
      </ol>
      <p className="text-sm text-muted">
        Also make sure <span className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span> is set
        in <span className="font-mono text-xs">.env</span>.
      </p>
      {message && (
        <p className="rounded-lg border border-edge bg-ink-2 p-3 font-mono text-[10px] break-all text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
