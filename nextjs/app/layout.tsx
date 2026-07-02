import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remove BG",
  description: "Remove image and video backgrounds with a self-hosted server."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
