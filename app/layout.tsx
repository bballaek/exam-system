import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const sarabun = Sarabun({
  weight: ["400", "500", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "แบบทดสอบออนไลน์ | Online Exam System",
  description: "ระบบทำแบบทดสอบออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
