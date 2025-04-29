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
const API_BASE = "https://anibal98.com/api";
export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
      return
    }
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }
    const mail = email.toLowerCase().trim()
    if (!mail.endsWith("@educa.jcyl.es")) {
      setError("El mail no es válido")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: name,
          password: password,
          mail: mail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Registro exitoso. Redirigiendo al inicio de sesión...")
        // Esperar 2 segundos antes de redirigir
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Error al registrar. Por favor, inténtalo de nuevo.")
      }
    } catch (err) {
      console.error("Error al registrar:", err)
      setError("Error de conexión con el servidor. Por favor, inténtalo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-700">
      <Card className="w-[350px]">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-700">Registro</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6">
            <div className="grid w-full items-center gap-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Introduce tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Repite la contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
