import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
      <div className="animate-rise flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="title-display text-4xl">
            WELCOME BACK, <span className="text-hot">LARPER</span>
          </h1>
          <p className="mt-2 font-mono text-sm text-muted">
            Your LARP score missed you. Sign in to disappoint it again.
          </p>
        </div>
        <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
