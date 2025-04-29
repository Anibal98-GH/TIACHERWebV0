"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

// URL base del proxy
const API_BASE = "http://188.34.195.5/api";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
      return
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mail: email,
          password: password,
        }),
      })

      // Verificamos si la respuesta es JSON
      const contentType = response.headers.get("content-type")
      let data

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error("Respuesta no JSON:", text)
        throw new Error("El servidor no devolvió una respuesta JSON válida")
      }

      if (response.ok) {
        if (data.logged && data.access > 0) {
          console.log("Login exitoso:", data)
          localStorage.setItem("userEmail", data.mail)
          localStorage.setItem("rol", data.access)
          localStorage.setItem("token", data.token)
          router.push("/dashboard")
        } else {
          // Usuario autenticado pero sin acceso
          setError("Tu cuenta no tiene permisos de acceso o está pendiente de activación.")
        }
      } else {
        // Error de autenticación
        setError(data.error || "Credenciales incorrectas. Por favor, inténtalo de nuevo.")
      }
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err)
      router.push("/")

      setError(err.message || "Error de conexión con el servidor. Por favor, inténtalo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600">
      <Card className="w-[350px]">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-700">Iniciar Sesión</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="grid w-full items-center gap-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Introduce tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
