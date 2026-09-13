import type { ComponentProps } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const clerkAppearance: ComponentProps<typeof ClerkProvider>["appearance"] = {
  variables: {
    colorPrimary: "#ff2d78",
    colorPrimaryForeground: "#07070d",
    colorBackground: "#12121d",
    colorForeground: "#ffffff",
    colorMutedForeground: "#9a9ab0",
    colorInput: "#0d0d16",
    colorInputForeground: "#ffffff",
    colorNeutral: "#ffffff",
    colorDanger: "#ff4545",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-grotesk), system-ui, sans-serif",
  },
  elements: {
    card: "border border-edge bg-panel shadow-2xl",
    headerTitle: "title-display",
    headerSubtitle: "text-muted",
    socialButtonsBlockButton: "border-edge bg-panel-2 hover:bg-panel",
    formButtonPrimary: "bg-hot text-ink hover:brightness-110",
    footerActionLink: "text-hot hover:text-hot/80",
    formFieldInput: "border-edge bg-ink-2",
  },
};
