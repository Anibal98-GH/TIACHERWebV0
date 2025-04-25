import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">Bienvenido a TIACHER</h1>
        <p className="mb-8 text-xl text-white">Sube tus PDFs para generar exámenes tipo test.</p>
        <div className="space-x-4">
          <Button asChild className="bg-blue-700 hover:bg-blue-800">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="text-blue-900 bg-white/80 border-white hover:bg-white hover:text-blue-700"
          >
            <Link href="/register">Registro</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
