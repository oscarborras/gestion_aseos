import type { Metadata } from "next";
import { Lexend, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/utils/supabase/server";
import { getUserRoles } from "@/app/actions";
import LayoutClient from "./LayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panel de control - SchoolApp",
  description: "Gestión de Aseos Escolares",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const roles = await getUserRoles()

  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased bg-background-light dark:bg-background-dark min-h-screen font-sans text-gray-800 dark:text-gray-100 transition-colors duration-200`}
      >
        <LayoutClient user={user} roles={roles}>
          {children}
        </LayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
