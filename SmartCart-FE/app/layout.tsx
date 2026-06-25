import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExternalWidgetHider } from "@/components/ui/ExternalWidgetHider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "SmartCart Bunny",
  description: "Cute pastel ecommerce frontend for SmartCart"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ExternalWidgetHider />
      </body>
    </html>
  );
}
