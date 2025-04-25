"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, LogOut, BookOpen, Search, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_URL = "https://9aca-2a01-4f8-1c1c-7c0e-00-1.ngrok-free.app"

export default function Dashboard() {
  const [aiModels, setAiModels] = useState<{ name: string; value: string; image: string }[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [autoSelect, setAutoSelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) // Nuevo estado para controlar si se está generando el examen
  const router = useRouter()


  useEffect(() => {
    
    const token = localStorage.getItem("token")
    if (!token) {
        router.push("/login")
        return
    }
    const rol = localStorage.getItem("rol") || ""
    setIsAdmin(rol == "2")

    fetch(`${API_URL}/api/models/all`, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Record<string, string>) => {
        const arr = Object.entries(data).map(([name, value]) => {
          // Elige el logo según keywords en el nombre
          const key = name.toLowerCase()
          let imageURL: string
          if (key.includes("claude")) {
            imageURL = "/images/claude-logo.png"
          } else if (key.includes("grok")) {
            imageURL = "/images/grok-logo.png"
          } else if (key.includes("gemini")) {
            imageURL = "/images/gemini-logo.png"
          } else {
            imageURL = "/images/gpt-logo.png"
          }
          return { name, value, image: imageURL }
        })
        setAiModels(arr)
      })
      .catch((err) => {
        console.error("Error al cargar modelos:", err)
        // Datos de ejemplo en caso de error
        setAiModels([
          { name: "OpenAI GPT 4o mini", value: "gpt-4o-mini", image: "/images/gpt-logo.png" },
          { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet", image: "/images/claude-logo.png" },
          { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash", image: "/images/gemini-logo.png" },
          { name: "Grok 1.5", value: "grok-1.5", image: "/images/grok-logo.png" },
        ])
      })
  }, [])

  const filteredModels = useMemo(() => {
    return aiModels.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, aiModels])

  useEffect(() => {
    if (!autoSelect || filteredModels.length === 0) return

    // Búsqueda case-insensitive
    const namesLc = filteredModels.map((m) => m.name.toLowerCase())

    // 1) Intenta exact match "chat gpt 4.5 preview"
    const idxExact = namesLc.findIndex((n) => n.includes("chat gpt 4.5 preview"))
    if (idxExact !== -1) {
      setSelectedModel(filteredModels[idxExact])
      return
    }

    // 2) Filtra los que comienzan por "chat gpt 4."
    const candidates = filteredModels.filter((m) => m.name.toLowerCase().startsWith("chat gpt 4."))
    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length)
      setSelectedModel(candidates[randomIndex])
      return
    }

    // 3) Si tampoco hay, al azar entre todos
    const randomIndex = Math.floor(Math.random() * filteredModels.length)
    setSelectedModel(filteredModels[randomIndex])
  }, [autoSelect, filteredModels])

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...selectedFiles])
    }
  }

  const handleGenerate = async (type: "exam" | "exercise") => {
    if (!selectedModel || files.length === 0 || isGenerating) return

    // Activar el estado de generación
    setIsGenerating(true)

    try {
      // 1) Creamos el FormData
      const formData = new FormData()
      formData.append("model", selectedModel.value)
      formData.append("type", type)
      files.forEach((file) => {
        formData.append("files", file, file.name)
      })

      // 2) Hacemos el POST como multipart/form-data
      const res = await fetch(`${API_URL}/api/exam/create`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        alert("Error: " + (err.message || res.statusText))
        return
      }

      // 3) Leemos la respuesta
      const data = await res.json()
      console.log("Examen creado:", data)
      console.log(data.id)
      localStorage.setItem("examId", data.id)
      localStorage.setItem("examData", JSON.stringify(data.preguntas))
      // Por ejemplo, si data.examId existe:
      router.push(`/examen`)
    } catch (e: any) {
      console.error("Fallo en la petición:", e)
      alert("No se pudo conectar con el servidor.")
    } finally {
      // Desactivar el estado de generación, aunque esto no se ejecutará si la redirección es exitosa
      setIsGenerating(false)
    }
  }

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">TIACHER</h1>
          <div className="flex space-x-2">
            {isAdmin && (
              <Button
                variant="outline"
                className="bg-purple-500 text-white border-purple-400 hover:bg-purple-600"
                asChild
              >
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Administrar
                </Link>
              </Button>
            )}
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
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-blue-100 rounded-xl overflow-hidden">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-700">Subir archivos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const droppedFiles = Array.from(e.dataTransfer.files)
                  const pdfs = droppedFiles.filter(
                    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
                  )
                  if (pdfs.length !== droppedFiles.length) {
                    alert("Solo se permiten archivos PDF.")
                  }
                  setFiles((prev) => [...prev, ...pdfs])
                }}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-blue-400" />
                <p className="mt-2 text-sm text-blue-600">
                  Arrastra y suelta archivos PDF aquí, o haz clic para seleccionar
                </p>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return
                    const sel = Array.from(e.target.files)
                    const pdfs = sel.filter(
                      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
                    )
                    if (pdfs.length !== sel.length) {
                      alert("Solo se permiten archivos PDF.")
                    }
                    setFiles((prev) => [...prev, ...pdfs])
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-blue-700">Archivos subidos:</h3>
                  <ul className="list-disc list-inside">
                    {files.map((file, idx) => (
                      <li key={file.name + idx} className="flex items-center text-blue-600">
                        <FileText className="mr-2 h-4 w-4" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-blue-100 rounded-xl overflow-hidden">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-700">Elegir modelo de IA</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="auto-select" className="text-base font-semibold text-blue-800">
                  Selección recomendada de modelo IA
                </Label>
                <Switch
                  id="auto-select"
                  checked={autoSelect}
                  onCheckedChange={setAutoSelect}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <Input
                  type="text"
                  placeholder="Buscar modelos de IA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              {filteredModels.length > 0 ? (
                <Slider {...sliderSettings}>
                  {filteredModels.map((model, index) => (
                    <div key={index} className="px-2">
                      <div
                        className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
                          selectedModel === model
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                        onClick={() => !autoSelect && setSelectedModel(model)}
                      >
                        <div className="flex justify-center items-center h-24 mb-2">
                          <img
                            src={model.image || "/placeholder.svg"}
                            alt={model.name}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-sm font-medium">{model.name}</p>
                      </div>
                    </div>
                  ))}
                </Slider>
              ) : (
                <p className="text-center text-blue-500">
                  No se encontraron modelos de IA que coincidan con tu búsqueda.
                </p>
              )}
              {selectedModel && (
                <p className="mt-4 text-center font-medium text-blue-700">Modelo seleccionado: {selectedModel.name}</p>
              )}
            </CardContent>
          </Card>

          {/* Mensaje de generación de examen */}
          {isGenerating && (
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <div className="flex items-center">
                <div className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                <AlertDescription className="font-medium">
                  Se está generando el examen, espera por favor...
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex justify-center mt-6">
            <Button
              onClick={() => handleGenerate("exam")}
              disabled={!selectedModel || files.length === 0 || isGenerating}
              className={`flex items-center shadow-md rounded-xl ${
                isGenerating ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"
              }`}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {isGenerating ? "Generando examen..." : "Crear examen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
