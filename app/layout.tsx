import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interaction Principles — interactive lessons in how interfaces feel",
  description:
    "Free, no signup. 8 interactive lessons in interaction design: springs, latency, velocity handoff, frame budget, and more. Grab the controls and feel the physics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
