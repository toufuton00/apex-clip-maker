import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APEX Clip Maker | ゲームクリップからショート動画を作ろう",
  description: "Apex LegendsのプレイクリップからTikTok風ショート動画を簡単に作成",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="antialiased bg-[#0a0a0a] text-white min-h-dvh font-sans">
        {children}
      </body>
    </html>
  );
}
