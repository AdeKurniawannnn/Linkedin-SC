import type { Metadata } from "next";
import { Raleway, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkedScraper - LinkedIn Query Builder",
  description: "Build advanced LinkedIn search queries with toggles. Powered by Bright Data API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}
