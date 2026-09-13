import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/battle", label: "Battle" },
  { href: "/quiz", label: "Quiz" },
  { href: "/daily", label: "Daily" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="title-display flex items-center gap-2 text-xl tracking-tight">
          <span className="text-hot">LARP</span>
          <span>INATOR</span>
          <span className="animate-blink text-lime">▮</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-white sm:block"
            >
              My LARP
            </Link>
            <Link
              href="/history"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-white sm:block"
            >
              History
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 ring-2 ring-hot/60" } }} />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="btn-ghost">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="btn-hot">Get LARPed</button>
            </SignUpButton>
          </Show>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-edge/50 px-4 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
