import type { Metadata } from "next"
import "./globals.css"
import type React from "react"

export const metadata: Metadata = {
  title: "Analizador de Archivos con IA",
  description: "Sube y analiza archivos usando varios modelos de IA",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
