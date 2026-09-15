import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plate",
  description: "A diary for meals out. Your taste, nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistMono.variable} h-full`}>
      <body
        className={`${GeistMono.className} flex min-h-full flex-col bg-table text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
