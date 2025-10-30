"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, X, Calendar as CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createApiUrl, apiRequest } from "@/lib/api-config"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface KeyResult {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  status: "not_started" | "in_progress" | "completed" | "at_risk"
}

interface User {
  id: string
  name: string
  avatar?: string
}

interface CreateOKRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  members: User[]
  onOKRCreated: () => void
}

const QUARTERS = [
  "Q1 2026",
  "Q2 2026", 
  "Q3 2026",
  "Q4 2026"
]

const UNITS = [
  { value: "percentage", label: "Porcentaje (%)" },
  { value: "users", label: "Usuarios" },
  { value: "seconds", label: "Segundos" },
  { value: "rating", label: "Calificación (estrellas)" },
  { value: "tickets", label: "Tickets" },
  { value: "integrations", label: "Integraciones" },
  { value: "amount", label: "Cantidad" },
  { value: "currency", label: "Moneda" }
]

export function CreateOKRDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  members,
  onOKRCreated
}: CreateOKRDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Datos del OKR
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [quarter, setQuarter] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  
  // Key Results
  const [keyResults, setKeyResults] = useState<Partial<KeyResult>[]>([
    {
      title: "",
      description: "",
      targetValue: 0,
      currentValue: 0,
      unit: "percentage",
      status: "not_started"
    }
  ])

  const handleAddKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        title: "",
        description: "",
        targetValue: 0,
        currentValue: 0,
        unit: "percentage",
        status: "not_started"
      }
    ])
  }

  const handleRemoveKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index))
    }
  }

  const handleKeyResultChange = (index: number, field: string, value: any) => {
    const updatedKeyResults = [...keyResults]
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: value
    }
    setKeyResults(updatedKeyResults)
  }

  const generateId = () => {
    return Math.random().toString(36).substr(2, 4)
  }

  // Helper function para validaciones con toast
  const showValidationError = (description: string) => {
    toast({
      title: "Error de validación",
      description,
      variant: "destructive"
    })
    return false
  }

  const validateForm = () => {
    if (!title.trim()) return showValidationError("El título del objetivo es requerido")
    if (!description.trim()) return showValidationError("La descripción del objetivo es requerida")
    if (!ownerId) return showValidationError("Debe seleccionar un responsable")
    if (!quarter) return showValidationError("Debe seleccionar un trimestre")
    if (!startDate || !endDate) return showValidationError("Las fechas de inicio y fin son requeridas")
    if (new Date(startDate) >= new Date(endDate)) {
      return showValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
    }

    // Validar Key Results
    for (let i = 0; i < keyResults.length; i++) {
      const kr = keyResults[i]
      const krNum = i + 1
      
      if (!kr.title?.trim()) return showValidationError(`El título del resultado clave ${krNum} es requerido`)
      if (!kr.description?.trim()) return showValidationError(`La descripción del resultado clave ${krNum} es requerida`)
      if (!kr.targetValue || kr.targetValue <= 0) {
        return showValidationError(`El valor objetivo del resultado clave ${krNum} debe ser mayor a 0`)
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // Crear el OKR
      const newOKR = {
        id: `okr_${generateId()}`,
        projectId,
        title,
        description,
        type: "objective" as const,
        ownerId,
        quarter,
        status: "not_started" as const,
        progress: 0,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        createdAt: new Date().toISOString(),
        keyResults: keyResults.map(kr => ({
          id: `kr_${generateId()}`,
          title: kr.title!,
          description: kr.description!,
          targetValue: kr.targetValue!,
          currentValue: kr.currentValue || 0,
          unit: kr.unit!,
          status: "not_started" as const
        }))
      }

      // Crear el OKR usando la API real
      const url = createApiUrl('/okrs')
      const response = await apiRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOKR)
      })
      
      if (!response.ok) {
        throw new Error('Error al crear el OKR')
      }
      
      toast({
        title: "OKR creado exitosamente",
        description: `El objetivo "${title}" ha sido agregado al proyecto ${projectName}`,
      })

      // Resetear formulario
      setTitle("")
      setDescription("")
      setOwnerId("")
      setQuarter("")
      setStartDate(undefined)
      setEndDate(undefined)
      setKeyResults([{
        title: "",
        description: "",
        targetValue: 0,
        currentValue: 0,
        unit: "percentage",
        status: "not_started"
      }])

      onOKRCreated()
      onOpenChange(false)
      
    } catch (error) {
      console.error("Error creating OKR:", error)
      toast({
        title: "Error al crear OKR",
        description: "Hubo un problema al crear el objetivo. Inténtalo nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getUnitLabel = (unit: string) => {
    return UNITS.find(u => u.value === unit)?.label || unit
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Crear Nuevo OKR
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo objetivo y resultados clave para {projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica del objetivo */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título del Objetivo *</Label>
              <Input
                id="title"
                placeholder="Ej: Lanzar versión beta funcional"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe el objetivo de manera clara y específica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner">Responsable *</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quarter">Trimestre *</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map(q => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Resultados Clave */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resultados Clave *</h3>
                <p className="text-sm text-muted-foreground">
                  Define los resultados medibles que determinarán el éxito de tu objetivo
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddKeyResult}
                disabled={keyResults.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            <div className="space-y-4">
              {keyResults.map((kr, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Resultado Clave {index + 1}
                      </CardTitle>
                      {keyResults.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKeyResult(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Título *</Label>
                      <Input
                        placeholder="Ej: Completar 80% de las user stories del MVP"
                        value={kr.title || ""}
                        onChange={(e) => handleKeyResultChange(index, "title", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Descripción *</Label>
                      <Textarea
                        placeholder="Describe cómo se medirá este resultado..."
                        value={kr.description || ""}
                        onChange={(e) => handleKeyResultChange(index, "description", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Unidad de Medida *</Label>
                        <Select
                          value={kr.unit || "percentage"}
                          onValueChange={(value) => handleKeyResultChange(index, "unit", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map(unit => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Valor Objetivo *</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={kr.targetValue || ""}
                          onChange={(e) => handleKeyResultChange(index, "targetValue", Number(e.target.value))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Valor Actual</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={kr.currentValue || 0}
                          onChange={(e) => handleKeyResultChange(index, "currentValue", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Meta: {kr.targetValue} {getUnitLabel(kr.unit || "percentage")}
                      </Badge>
                      <Badge variant="secondary">
                        Actual: {kr.currentValue || 0} {getUnitLabel(kr.unit || "percentage")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear OKR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}