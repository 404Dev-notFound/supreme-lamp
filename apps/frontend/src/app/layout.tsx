// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import ModalManager from "@/components/modals/ModalManager";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "flowCTRL | Career Operating System",
  description:
    "Identify skill gaps, generate roadmaps, and land your dream job.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        outfit.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="fixed inset-0 -z-10">
          <iframe
            src="/lamp.html"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
        {children}
        <Suspense fallback={null}>
          <ModalManager />
        </Suspense>
      </body>
    </html>
  );
}
