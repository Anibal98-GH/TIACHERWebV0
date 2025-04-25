import type { Metadata } from "next"
import "./globals.css"
import type React from "react"

export const metadata: Metadata = {
  title: "TIACHER - Generador de Exámenes",
  description: "Sube y analiza archivos usando varios modelos de IA para generar exámenes tipo test",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  )
}
