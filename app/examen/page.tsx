"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LogOut, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// URL base del proxy
const API_BASE = "http://188.34.195.5/api";

// Tipo para una respuesta
interface Respuesta {
  id: number
  texto: string
  correcta: boolean
}

// Tipo para una pregunta
interface Pregunta {
  id: number
  texto: string
  respuestas: Respuesta[]
}

export default function ExamenCreado() {
  // Información del examen
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [examId, setExamId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Estado con las preguntas
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])

  // Al montarse, cargamos de localStorage
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    const id = localStorage.getItem("examId")
    if (!id) {
      router.push("/dashboard")
      return
    } else {
      setExamId(id)
    }
    console.log(id)
    // Cargar metadata
    const rawMeta = localStorage.getItem("examMeta")
    if (rawMeta) {
      try {
        const meta = JSON.parse(rawMeta) as {
          title: string
          subject: string
          description: string
        }
        setTitle(meta.title || "Examen generado")
        setSubject(meta.subject || "Asignatura")
        setDescription(meta.description || "Examen generado automáticamente")
      } catch {
        console.error("Error parsing examMeta from localStorage")
        setTitle("Examen generado")
        setSubject("Asignatura")
        setDescription("Examen generado automáticamente")
      }
    } else {
      setTitle("Examen generado")
      setSubject("Asignatura")
      setDescription("Examen generado automáticamente")
    }

    // Cargar preguntas
    const raw = localStorage.getItem("examData")
    const idExamen = localStorage.getItem("examId")
    if (raw) {
      try {
        const arr = JSON.parse(raw) as Array<{
          pregunta: string
          respuestas: Record<string, string>
          correcta: number
        }>
        const loaded: Pregunta[] = arr.map((item, idx) => ({
          id: idx + 1,
          texto: item.pregunta,
          respuestas: Object.entries(item.respuestas).map(([key, val]) => ({
            id: Number.parseInt(key, 10),
            texto: val,
            correcta: Number.parseInt(key, 10) === item.correcta,
          })),
        }))
        setPreguntas(loaded)
      } catch (error) {
        console.error("Error parsing examData from localStorage", error)
      }
    }
  }, [])

  const actualizarTextoPregunta = (idPregunta: number, nuevoTexto: string) => {
    setPreguntas(preguntas.map((p) => (p.id === idPregunta ? { ...p, texto: nuevoTexto } : p)))
  }

  const actualizarTextoRespuesta = (idPregunta: number, idRespuesta: number, nuevoTexto: string) => {
    setPreguntas(
      preguntas.map((p) =>
        p.id === idPregunta
          ? {
              ...p,
              respuestas: p.respuestas.map((r) => (r.id === idRespuesta ? { ...r, texto: nuevoTexto } : r)),
            }
          : p,
      ),
    )
  }

  const marcarRespuestaCorrecta = (idPregunta: number, idRespuesta: number) => {
    setPreguntas(
      preguntas.map((p) =>
        p.id === idPregunta
          ? {
              ...p,
              respuestas: p.respuestas.map((r) => ({
                ...r,
                correcta: r.id === idRespuesta,
              })),
            }
          : p,
      ),
    )
  }

  // Modificar la función guardarExamen para manejar la descarga del PDF

  const guardarExamen = async () => {
    setIsSaving(true)

    try {
      // Guardar metadata en localStorage
      const metaData = { title, subject, description }
      localStorage.setItem("examMeta", JSON.stringify(metaData))

      // Preparar respuestas correctas (ahora llamadas respuestasCorrectas)
      const respuestasCorrectas = preguntas.map((pregunta) => {
        // Encontrar la respuesta correcta para esta pregunta
        const respuestaCorrecta = pregunta.respuestas.find((r) => r.correcta)

        // Convertir el ID de respuesta a letra (1=A, 2=B, 3=C, 4=D)
        let letraRespuesta = "A"
        if (respuestaCorrecta) {
          switch (respuestaCorrecta.id) {
            case 1:
              letraRespuesta = "A"
              break
            case 2:
              letraRespuesta = "B"
              break
            case 3:
              letraRespuesta = "C"
              break
            case 4:
              letraRespuesta = "D"
              break
          }
        }

        return {
          numeroPregunta: pregunta.id,
          respuestaCorrecta: letraRespuesta,
        }
      })

      // Preparar la lista de preguntas con sus respuestas en formato A, B, C, D
      const preguntasConRespuestas = preguntas.map((pregunta) => {
        // Convertir las respuestas a formato con letras
        const respuestasFormateadas: Record<string, string> = {}

        pregunta.respuestas.forEach((respuesta) => {
          let letra = "A"
          switch (respuesta.id) {
            case 1:
              letra = "A"
              break
            case 2:
              letra = "B"
              break
            case 3:
              letra = "C"
              break
            case 4:
              letra = "D"
              break
          }
          respuestasFormateadas[letra] = respuesta.texto
        })

        return {
          numeroPregunta: pregunta.id,
          pregunta: pregunta.texto,
          respuestas: respuestasFormateadas,
        }
      })

      // Datos a enviar al backend
      const datosExamen = {
        id: examId,
        titulo: title,
        asignatura: subject,
        descripcion: description,
        respuestasCorrectas: respuestasCorrectas,
        preguntas: preguntasConRespuestas,
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      // Enviar datos al backend usando el proxy
      const response = await fetch(`${API_BASE}/exam/final`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosExamen),
      })

      if (!response.ok) {
        throw new Error(`Error al guardar el examen: ${response.status} ${response.statusText}`)
      }

      // Manejar la respuesta como un blob (archivo PDF)
      const blob = await response.blob()

      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un elemento <a> temporal
      const link = document.createElement("a")
      link.href = url

      // Obtener el nombre del archivo de las cabeceras de respuesta o usar uno predeterminado
      const contentDisposition = response.headers.get("content-disposition")
      let filename = "examen.pdf"

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
        }
      }

      link.download = filename

      // Añadir el enlace al documento
      document.body.appendChild(link)

      // Simular clic en el enlace para iniciar la descarga
      link.click()

      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Mostrar mensaje de éxito
      alert("Examen guardado y descargado correctamente")
    } catch (error) {
      console.error("Error al guardar el examen:", error)
      alert("Error al guardar el examen. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-4xl font-bold text-white">Examen Creado</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="bg-green-500 text-white border-green-400 hover:bg-green-600"
              onClick={guardarExamen}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="outline" className="bg-red-500 text-white border-red-400 hover:bg-red-600" asChild>
              <Link
                href="/"
                onClick={() => {
                  localStorage.clear()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-blue-100 rounded-xl overflow-hidden mb-8">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">Información del Examen</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Título del Examen</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-blue-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Asignatura</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="border-blue-200" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">Normas a tener en cuenta</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-blue-200"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {preguntas.map((pregunta) => (
          <Card key={pregunta.id} className="border-blue-100 rounded-xl overflow-hidden mb-6">
            <CardHeader className="bg-blue-50 py-3">
              <div className="flex items-center">
                <span className="font-bold text-blue-700 mr-2">{pregunta.id}.</span>
                <Input
                  value={pregunta.texto}
                  onChange={(e) => actualizarTextoPregunta(pregunta.id, e.target.value)}
                  className="border-blue-200"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pregunta.respuestas.map((respuesta) => (
                  <div key={respuesta.id} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`pregunta-${pregunta.id}-respuesta-${respuesta.id}`}
                        checked={respuesta.correcta}
                        onCheckedChange={() => marcarRespuestaCorrecta(pregunta.id, respuesta.id)}
                        className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="font-medium text-blue-700">
                        {respuesta.id === 1 ? "A" : respuesta.id === 2 ? "B" : respuesta.id === 3 ? "C" : "D"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={respuesta.texto}
                        onChange={(e) => actualizarTextoRespuesta(pregunta.id, respuesta.id, e.target.value)}
                        className={`
                          border-blue-200
                          ${respuesta.correcta ? "bg-[#5499F8] text-white placeholder-white" : ""}
                        `}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center mt-8">
          <Button
            onClick={guardarExamen}
            className="bg-blue-700 hover:bg-blue-800 text-white shadow-md rounded-xl px-8"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Guardando Examen..." : "Guardar Examen"}
          </Button>
        </div>
      </div>
    </div>
  )
}
