import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AutoUpdate from "@/components/layout/AutoUpdate";
import { LanguageProvider } from "../context/LanguageContext";
import AppLayout from "@/components/layout/AppLayout";
import AuthProvider from "@/components/providers/AuthProvider";
// 👇 1. Novos Imports necessários
import { DashboardProvider } from "@/providers/DashboardContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StockMaster Pro | Gestão Logística",
  description:
    "Sistema de controle de estoque minimalista inspirado em logística",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <AuthProvider>
          {/* 👇 2. Adicionamos o DashboardProvider AQUI */}
          {/* Ele precisa envolver o AppLayout para a Sidebar conseguir ler o contador */}
          <DashboardProvider>
            <LanguageProvider>
              <AutoUpdate />
              <AppLayout>{children}</AppLayout>
              {/* 👇 3. Adicionamos o Toaster para as notificações bonitas */}
              <Toaster richColors position="top-right" closeButton />
            </LanguageProvider>
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
