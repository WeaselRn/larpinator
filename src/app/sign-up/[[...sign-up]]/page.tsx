import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
      <div className="animate-rise flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="title-display text-4xl">
            BECOME A <span className="text-hot">CERTIFIED LARPER</span>
          </h1>
          <p className="mt-2 font-mono text-sm text-muted">
            It takes 30 seconds. The emotional damage lasts longer.
          </p>
        </div>
        <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
