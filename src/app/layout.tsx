import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. Importa el Toaster (asegúrate de haber ejecutado npx shadcn-ui@latest add sonner)
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Micro-Trello | Agencia de Ciberseguridad",
  description: "Gestor de misiones con auditoría avanzada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* 2. Colócalo aquí para que esté disponible en toda la app */}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}