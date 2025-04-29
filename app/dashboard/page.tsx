"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, LogOut, BookOpen, Search, Settings, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [selectedModel, setSelectedModel] = useState<{ name: string; value: string; image: string } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [autoSelect, setAutoSelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const sliderRef = useRef<Slider>(null) // Referencia al carrusel

  // Función para priorizar modelos específicos
  const prioritizeModels = (models: { name: string; value: string; image: string }[]) => {
    // Modelos prioritarios en el orden deseado
    const priorityModels = ["Chat GPT 4.5 preview", "Grok 3 Beta", "Gemini 1.5 pro"]

    // Crear una copia del array original para no modificarlo directamente
    const modelsCopy = [...models]

    // Array para almacenar los modelos priorizados
    const prioritized: typeof models = []

    // Buscar y extraer los modelos prioritarios en el orden especificado
    priorityModels.forEach((priorityName) => {
      // Buscar coincidencias parciales (case insensitive)
      const index = modelsCopy.findIndex((model) => model.name.toLowerCase().includes(priorityName.toLowerCase()))

      if (index !== -1) {
        // Si se encuentra, añadirlo a los priorizados y eliminarlo de la copia
        prioritized.push(modelsCopy[index])
        modelsCopy.splice(index, 1)
      }
    })

    // Devolver los modelos priorizados seguidos por el resto
    return [...prioritized, ...modelsCopy]
  }

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
        "Content-Type": "application/json" 
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Record<string, string>) => {
        const arr = Object.entries(data).map(([name, value]) => {
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

        // Priorizar los modelos específicos
        const prioritizedModels = prioritizeModels(arr)
        setAiModels(prioritizedModels)

        // Si hay modelos y autoSelect está activado, seleccionar el primero
        if (prioritizedModels.length > 0 && autoSelect) {
          setSelectedModel(prioritizedModels[0])
        }
      })
      .catch((err) => {
        console.error("Error al cargar modelos:", err)
        // Datos de ejemplo en caso de error, también priorizados
        const exampleModels = [
          { name: "OpenAI GPT 4o mini", value: "gpt-4o-mini", image: "/images/gpt-logo.png" },
          { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet", image: "/images/claude-logo.png" },
          { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash", image: "/images/gemini-logo.png" },
          { name: "Grok 1.5", value: "grok-1.5", image: "/images/grok-logo.png" },
        ]
        setAiModels(prioritizeModels(exampleModels))
      })
  }, [])

  const filteredModels = useMemo(() => {
    return aiModels.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, aiModels])

  useEffect(() => {
    if (!autoSelect || filteredModels.length === 0) return

    // Si hay modelos filtrados y autoSelect está activado, seleccionar el primero
    // (que ya estará priorizado según nuestra lógica)
    setSelectedModel(filteredModels[0])
  }, [autoSelect, filteredModels])

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prevFiles) => [...prevFiles, ...droppedFiles])
  }

  const handleGenerate = async (type: "exam" | "exercise") => {
    if (!selectedModel || files.length === 0 || isGenerating) return
    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("model", selectedModel.value)
      formData.append("type", type)
      files.forEach((file) => {
        formData.append("files", file, file.name)
      })

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

      const data = await res.json()
      localStorage.setItem("examId", data.id)
      localStorage.setItem("examData", JSON.stringify(data.preguntas))
      router.push(`/examen`)
    } catch (e: any) {
      console.error("Fallo en la petición:", e)
      alert("No se pudo conectar con el servidor.")
    } finally {
      setIsGenerating(false)
    }
  }

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false, // No usamos las flechas internas
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2, slidesToScroll: 1 },
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  }

  const handlePrev = () => sliderRef.current?.slickPrev()
  const handleNext = () => sliderRef.current?.slickNext()

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
              <Link href="/" onClick={() => localStorage.clear()}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-blue-100 rounded-xl overflow-hidden mb-8">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">Subir archivos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
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
                  const pdfs = sel.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
                  if (pdfs.length !== sel.length) {
                    alert("Solo se permiten archivos PDF.")
                  }
                  setFiles((prev) => [...prev, ...pdfs])
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <li key={file.name + idx} className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                    <div className="flex items-center text-blue-600">
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="truncate max-w-[250px]">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100 rounded-xl overflow-hidden">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">Elegir modelo de IA</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-blue-800 font-semibold">Selección recomendada de modelo IA</Label>
              <Switch id="auto-select" checked={autoSelect} onCheckedChange={setAutoSelect} />
            </div>

            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
              <Input
                type="text"
                placeholder="Buscar modelos de IA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            {/* Botones de navegación del carrusel */}
            <div className="flex justify-end mb-4 space-x-4">
              <button onClick={handlePrev} className="bg-white/80 hover:bg-white p-2 rounded-full shadow transition">
                <ChevronLeft className="h-6 w-6 text-blue-600" />
              </button>
              <button onClick={handleNext} className="bg-white/80 hover:bg-white p-2 rounded-full shadow transition">
                <ChevronRight className="h-6 w-6 text-blue-600" />
              </button>
            </div>

            {/* Carrusel */}
            <div className="relative px-8 mx-5">
              {filteredModels.length > 0 ? (
                <Slider {...sliderSettings} ref={sliderRef}>
                  {filteredModels.map((model, index) => (
                    <div key={index} className="px-2">
                      <div
                        className={`p-4 rounded-xl text-center cursor-pointer ${
                          selectedModel?.value === model.value
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                        onClick={() => !autoSelect && setSelectedModel(model)}
                      >
                        <div className="flex justify-center items-center h-24 mb-2">
                          <img
                            src={model.image || "/placeholder.svg"}
                            alt={model.name}
                            className="max-h-full object-contain"
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
            </div>

            {selectedModel && (
              <p className="mt-4 text-center font-medium text-blue-700">Modelo seleccionado: {selectedModel.name}</p>
            )}
          </CardContent>
        </Card>

        {isGenerating && (
          <Alert className="mt-6 bg-blue-50 border-blue-200 text-blue-800">
            <div className="flex items-center">
              <div className="mr-3 animate-spin h-4 w-4 rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
              <AlertDescription>Se está generando el examen, espera por favor...</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex justify-center mt-6">
          <Button
            onClick={() => handleGenerate("exam")}
            disabled={!selectedModel || files.length === 0 || isGenerating}
            className="flex items-center shadow-md rounded-xl bg-blue-700 hover:bg-blue-800 text-white"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando examen..." : "Crear examen"}
          </Button>
        </div>
      </div>
    </div>
  )
}
