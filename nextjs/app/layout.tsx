import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CapWords Remove BG",
  description: "Remove image backgrounds with a self-hosted CapWords server."
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
