import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formless",
  description: "Forms that actually listen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#0f0f0f', color: '#ffffff' }}>{children}</body>
    </html>
  );
}
