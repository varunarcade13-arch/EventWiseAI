import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "EventWise AI — GenAI Event Planning Assistant",
  description:
    "Production-quality GenAI planning assistant for Weddings, Birthdays, Community, and Custom events powered by Google Gemini.",
  keywords: [
    "event planner",
    "wedding planning",
    "budget calculator",
    "event timeline",
    "vendor checklist",
    "Gemini AI",
    "EventWise",
  ],
  authors: [{ name: "EventWise AI Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
