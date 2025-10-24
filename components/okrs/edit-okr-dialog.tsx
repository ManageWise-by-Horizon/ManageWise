"use client"

import { useState, useEffect } from "react"
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
import { Target, Plus, X, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createApiUrl, apiRequest } from "@/lib/api-config"

interface KeyResult {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  status: "not_started" | "in_progress" | "completed" | "at_risk"
}

interface OKR {
  id: string
  projectId: string
  title: string
  description: string
  type: "objective"
  ownerId: string
  quarter: string
  status: "not_started" | "in_progress" | "completed" | "at_risk"
  progress: number
  startDate: string
  endDate: string
  createdAt: string
  keyResults: KeyResult[]
}

interface User {
  id: string
  name: string
  avatar?: string
}

interface EditOKRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  okr: OKR | null
  projectName: string
  members: User[]
  onOKRUpdated: () => void
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

const STATUS_OPTIONS = [
  { value: "not_started", label: "No iniciado" },
  { value: "in_progress", label: "En progreso" },
  { value: "at_risk", label: "En riesgo" },
  { value: "completed", label: "Completado" }
]

export function EditOKRDialog({
  open,
  onOpenChange,
  okr,
  projectName,
  members,
  onOKRUpdated
}: EditOKRDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Datos del OKR
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [quarter, setQuarter] = useState("")
  const [status, setStatus] = useState<"not_started" | "in_progress" | "completed" | "at_risk">("not_started")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Key Results
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])

  // Cargar datos del OKR cuando se abre el diálogo
  useEffect(() => {
    if (okr && open) {
      setTitle(okr.title)
      setDescription(okr.description)
      setOwnerId(okr.ownerId)
      setQuarter(okr.quarter)
      setStatus(okr.status)
      setStartDate(okr.startDate)
      setEndDate(okr.endDate)
      setKeyResults([...okr.keyResults])
    }
  }, [okr, open])

  const handleAddKeyResult = () => {
    const newKR: KeyResult = {
      id: `kr_${Math.random().toString(36).substr(2, 4)}`,
      title: "",
      description: "",
      targetValue: 0,
      currentValue: 0,
      unit: "percentage",
      status: "not_started"
    }
    setKeyResults([...keyResults, newKR])
  }

  const handleRemoveKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index))
    }
  }

  const handleKeyResultChange = (index: number, field: keyof KeyResult, value: any) => {
    const updatedKeyResults = [...keyResults]
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: value
    }
    setKeyResults(updatedKeyResults)
  }

  const calculateProgress = () => {
    if (keyResults.length === 0) return 0
    
    const totalProgress = keyResults.reduce((sum, kr) => {
      const krProgress = kr.unit === "seconds" 
        ? Math.max(0, Math.min(100, ((kr.targetValue - kr.currentValue + kr.targetValue) / kr.targetValue) * 100))
        : Math.min(100, (kr.currentValue / kr.targetValue) * 100)
      return sum + (isNaN(krProgress) ? 0 : krProgress)
    }, 0)
    
    return Math.round(totalProgress / keyResults.length)
  }

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Error de validación",
        description: "El título del objetivo es requerido",
        variant: "destructive"
      })
      return false
    }

    if (!description.trim()) {
      toast({
        title: "Error de validación", 
        description: "La descripción del objetivo es requerida",
        variant: "destructive"
      })
      return false
    }

    if (!ownerId) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un responsable",
        variant: "destructive"
      })
      return false
    }

    if (!quarter) {
      toast({
        title: "Error de validación",
        description: "Debe seleccionar un trimestre",
        variant: "destructive"
      })
      return false
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error de validación",
        description: "Las fechas de inicio y fin son requeridas",
        variant: "destructive"
      })
      return false
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast({
        title: "Error de validación",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive"
      })
      return false
    }

    // Validar Key Results
    for (let i = 0; i < keyResults.length; i++) {
      const kr = keyResults[i]
      if (!kr.title?.trim()) {
        toast({
          title: "Error de validación",
          description: `El título del resultado clave ${i + 1} es requerido`,
          variant: "destructive"
        })
        return false
      }

      if (!kr.description?.trim()) {
        toast({
          title: "Error de validación",
          description: `La descripción del resultado clave ${i + 1} es requerida`,
          variant: "destructive"
        })
        return false
      }

      if (!kr.targetValue || kr.targetValue <= 0) {
        toast({
          title: "Error de validación",
          description: `El valor objetivo del resultado clave ${i + 1} debe ser mayor a 0`,
          variant: "destructive"
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !okr) return

    setLoading(true)
    try {
      const updatedOKR = {
        ...okr,
        title,
        description,
        ownerId,
        quarter,
        status,
        startDate,
        endDate,
        progress: calculateProgress(),
        keyResults
      }

      // Actualizar el OKR usando la API real
      const url = createApiUrl(`/okrs/${okr.id}`)
      const response = await apiRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOKR)
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar el OKR')
      }
      
      console.log("OKR actualizado:", updatedOKR)
      
      toast({
        title: "OKR actualizado exitosamente",
        description: `El objetivo "${title}" ha sido actualizado`,
      })

      onOKRUpdated()
      onOpenChange(false)
      
    } catch (error) {
      console.error("Error updating OKR:", error)
      toast({
        title: "Error al actualizar OKR",
        description: "Hubo un problema al actualizar el objetivo. Inténtalo nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getUnitLabel = (unit: string) => {
    return UNITS.find(u => u.value === unit)?.label || unit
  }

  if (!okr) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar OKR
          </DialogTitle>
          <DialogDescription>
            Modifica el objetivo y resultados clave para {projectName}
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

            <div className="grid grid-cols-3 gap-4">
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

              <div className="grid gap-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Progreso calculado: {calculateProgress()}%
              </Badge>
            </div>
          </div>

          {/* Resultados Clave */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Resultados Clave *</h3>
                <p className="text-sm text-muted-foreground">
                  Modifica los resultados medibles que determinarán el éxito de tu objetivo
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
                <Card key={kr.id}>
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
                        value={kr.title}
                        onChange={(e) => handleKeyResultChange(index, "title", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Descripción *</Label>
                      <Textarea
                        placeholder="Describe cómo se medirá este resultado..."
                        value={kr.description}
                        onChange={(e) => handleKeyResultChange(index, "description", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label>Unidad *</Label>
                        <Select
                          value={kr.unit}
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
                        <Label>Objetivo *</Label>
                        <Input
                          type="number"
                          value={kr.targetValue}
                          onChange={(e) => handleKeyResultChange(index, "targetValue", Number(e.target.value))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Actual</Label>
                        <Input
                          type="number"
                          value={kr.currentValue}
                          onChange={(e) => handleKeyResultChange(index, "currentValue", Number(e.target.value))}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Estado</Label>
                        <Select
                          value={kr.status}
                          onValueChange={(value: any) => handleKeyResultChange(index, "status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Meta: {kr.targetValue} {getUnitLabel(kr.unit)}
                      </Badge>
                      <Badge variant="secondary">
                        Actual: {kr.currentValue} {getUnitLabel(kr.unit)}
                      </Badge>
                      <Badge variant={
                        kr.status === "completed" ? "default" :
                        kr.status === "in_progress" ? "secondary" :
                        kr.status === "at_risk" ? "destructive" : "outline"
                      }>
                        {STATUS_OPTIONS.find(s => s.value === kr.status)?.label}
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
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}