import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POCKET - Gestão Financeira Inteligente",
  description: "Controle total do seu dinheiro, investimentos e gastos em um só lugar.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pocket",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg", // Idealmente seria um PNG, mas SVG funciona em alguns casos ou como fallback
  },
};

import AuthProvider from '@/components/AuthProvider';
import PwaRegister from '@/components/PwaRegister';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <PwaRegister />
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: '!bg-white !text-black !rounded-[1.5rem] !shadow-2xl !border !border-gray-100 !px-6 !py-4 !text-xs !font-black !uppercase !tracking-wider',
              duration: 4000,
              style: {
                fontFamily: 'var(--font-geist-sans)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
