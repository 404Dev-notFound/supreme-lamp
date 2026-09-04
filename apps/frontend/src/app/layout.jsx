import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import ModalManager from "@/components/modals/ModalManager";
import AuthProvider from "@/components/AuthProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "flowCTRL | Career Operating System",
  description:
    "Identify skill gaps, generate roadmaps, and land your dream job.",
};

export default function RootLayout({ children }) {
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
        <AuthProvider>
          {children}
          <Suspense fallback={null}>
            <ModalManager />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
