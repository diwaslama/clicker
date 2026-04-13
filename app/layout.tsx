import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brisbane's Greatest Clicker",
  description: "Be no 1 in Brisbane's clicker game and claim your account to save your progress!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
