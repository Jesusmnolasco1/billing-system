// 1. MANTÉN TUS IMPORTACIONES ACTUALES (fonts, globals.css, etc.)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 2. AGREGA ESTA IMPORTACIÓN
import { Providers } from "@/components/providers"; 

// 3. MANTÉN TU CONFIGURACIÓN DE FUENTES (o lo que tengas aquí)
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tu Sistema de Facturación",
  description: "Descripción de tu sistema",
};

// 4. MODIFICA EL BODY PARA ENVOLVER CON PROVIDERS
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Aquí es donde envuelves todo */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}