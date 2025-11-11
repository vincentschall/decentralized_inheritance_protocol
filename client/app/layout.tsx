import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inheritance Protocol - Decentralized Estate Planning",
  description: "Secure your legacy with blockchain-based inheritance management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {children}
      </body>
    </html>
  );
}
