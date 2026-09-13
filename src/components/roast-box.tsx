export function RoastBox({ roast, title = "THE VERDICT" }: { roast: string; title?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-hot/40 bg-gradient-to-br from-panel via-panel to-hot/10 p-5 sm:p-7">
      <span className="pointer-events-none absolute -top-4 right-4 text-7xl opacity-15 select-none">
        🔥
      </span>
      <h3 className="title-display mb-3 text-xl text-hot">{title}</h3>
      <p className="text-base leading-relaxed whitespace-pre-line sm:text-lg">{roast}</p>
    </div>
  );
}
