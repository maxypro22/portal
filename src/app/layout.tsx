import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Elegant serif for headings, clean sans for body.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Steak Town — Luxury Steakhouse, Doha",
    template: "%s · Steak Town",
  },
  description:
    "Reserve your table at Steak Town — Doha's premier luxury steakhouse. Prime cuts, warm ambience, and impeccable service at Sapphire Plaza Hotel, Al Reem Street, Doha.",
  keywords: ["steakhouse", "Doha", "Qatar", "fine dining", "table booking", "Steak Town"],
};

export const viewport: Viewport = {
  themeColor: "#2d2424",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-brand-800 text-cream">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
