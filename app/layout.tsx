import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Media Generator",
  description: "AI-powered image and video generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
