import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Platform Management Console — Edition Vol. 1.0",
  description: "Byepo Technologies Feature Flag Management Control Room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-bg-paper text-ink-black selection:bg-editorial-red selection:text-bg-paper">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
