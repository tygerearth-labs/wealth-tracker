import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wealth Tracker - Kelola Keuangan Anda",
  description: "Aplikasi pencatatan keuangan modern untuk memantau pemasukan, pengeluaran, dan target tabungan Anda.",
  keywords: ["Keuangan", "Pencatatan Keuangan", "Tabungan", "Investasi", "Budget"],
  authors: [{ name: "Tyger Earth | Ahtjong Labs" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Wealth Tracker",
    description: "Aplikasi pencatatan keuangan modern",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-white text-gray-900`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ProfileProvider>
            {children}
            <Toaster />
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
