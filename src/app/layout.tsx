import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Archivo_Black, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "LARPINATOR — How hard are you LARPing?",
  description:
    "Submit your CV, GitHub, and music taste. Get roasted, scored, and ranked. The internet's bullshit detector.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${grotesk.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
