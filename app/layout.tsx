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
  title: "MasterExam | ระบบจัดการข้อสอบออนไลน์",
  description: "ระบบจัดการข้อสอบออนไลน์สำหรับครูและนักเรียน",
  icons: {
    icon: "/logo.svg",
  },
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
