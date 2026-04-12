import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bot Orchestrator | BlockWarriors",
  description: "Control and monitor multiple Minecraft bots for BlockWarriors debugging",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
