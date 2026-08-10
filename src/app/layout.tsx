import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on input focus, giving it a native app feel
};

export const metadata: Metadata = {
  title: "BGMI Arena | Premium Tournaments",
  description: "Join elite BGMI tournaments, showcase your skills, and win massive prize pools.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BGMI Arena",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Added pb-24 on mobile to prevent content from hiding under the bottom nav */}
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#0a0a0a] pb-24 md:pb-0`}>
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
