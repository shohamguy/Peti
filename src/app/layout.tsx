import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peti — לוח משרות",
  description: "מוצאים עבודה בקלות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <header className="header">
          <div className="container">
            <Link href="/" className="logo">Peti</Link>
            <nav className="nav">
              <Link href="/">משרות</Link>
              <Link href="/post" className="btn">פרסום משרה</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
