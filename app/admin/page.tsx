"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Trash } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Tipo para un usuario
interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

// URL base del backend
const API_URL = "https://9aca-2a01-4f8-1c1c-7c0e-00-1.ngrok-free.app"

export default function Admin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si el usuario está autenticado y es administrador
    const tokenFromStorage = localStorage.getItem("token")
    if (!tokenFromStorage) {
      router.push("/login")
      return
    }
    setToken(tokenFromStorage)
    // Cargar la lista de usuarios
    cargarUsuarios(tokenFromStorage)
  }, [router])

  const cargarUsuarios = async (tokenValue: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: "Bearer " + tokenValue,
        },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const raw = (await response.json()) as Record<
        string,
        {
          id_usuario: number
          mail: string
          name: string
          rol: string
        }
      >
      console.log(raw)
      const lista: Usuario[] = Object.values(raw).map((u) => ({
        id: u.id_usuario,
        nombre: u.name,
        email: u.mail,
        rol: u.rol,
      }))
      console.log(lista)
      setUsuarios(lista)
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      router.push("/dashboard")
      setError("Error al cargar la lista de usuarios. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const cambiarRol = async (id: number, nuevoRol: string) => {
    if (!token) return

    try {
      await fetch(`${API_URL}/api/admin/users/${id}/rol`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ rol: nuevoRol }),
        credentials: "include",
      })

      // Actualizar la lista de usuarios
      setUsuarios(usuarios.map((usuario) => (usuario.id === id ? { ...usuario, rol: nuevoRol } : usuario)))
    } catch (err) {
      console.error("Error al cambiar rol:", err)
      alert("Error al cambiar el rol del usuario. Por favor, inténtalo de nuevo.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-white">Panel de Administración</h1>
          </div>
        </div>

        <Card className="border-blue-100 rounded-xl overflow-hidden mb-8">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">Gestión de Usuarios</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                <p className="mt-2 text-blue-600">Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>{usuario.id}</TableCell>
                        <TableCell>{usuario.nombre}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              usuario.rol === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {usuario.rol}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                              onClick={() => cambiarRol(usuario.id, "ADMIN")}
                              disabled={usuario.rol === "ADMIN"}
                            >
                              Hacer administrador
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                              onClick={() => cambiarRol(usuario.id, "NORMAL")}
                              disabled={usuario.rol === "NORMAL"}
                            >
                              Hacer usuario normal
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                              onClick={() => cambiarRol(usuario.id, "ELIMINADO")}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
