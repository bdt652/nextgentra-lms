import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@nextgentra/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Student Portal - NextGenTra LMS",
  description: "Student portal for accessing courses and assignments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        {children}
      </body>
    </html>
  );
}
