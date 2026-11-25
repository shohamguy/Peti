import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import PwaRegister from "@/components/PwaRegister";
import { InstallBanner } from "@/components/InstallButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peti — משרות",
  description: "מוצאים עבודה בקלות — חיפוש משרות, שמירה והגשת מועמדות מהנייד",
  applicationName: "Peti",
  appleWebApp: { capable: true, title: "Peti", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ff6a3d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app">
          <InstallBanner />
          <main className="screen">{children}</main>
          <BottomNav />
        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
