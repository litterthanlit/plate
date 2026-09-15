import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en" className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-mono text-ink">
        {children}
      </body>
    </html>
  );
}
