import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Podcast Generator",
  description:
    "Create professional podcasts with AI-powered script generation, voice synthesis, and full audio production.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--background))] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
