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
import { Target, Plus, X, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useOkrs } from "@/lib/domain/okrs/hooks/use-okr"
import { okrService } from "@/lib/domain/okrs/services/okr.service"
import type { CreateOkrCommand, CreateKeyResultCommand } from "@/lib/domain/okrs/types/okr.types"

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
  const { createOkr, isLoading } = useOkrs()
  const [loading, setLoading] = useState(false)
  
  // Datos del OKR
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [quarter, setQuarter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
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
    if (!validateForm()) return

    setLoading(true)
    try {
      // Validar que el projectId existe
      if (!projectId || projectId.trim() === '') {
        throw new Error('El ID del proyecto no es válido.')
      }

      // Crear el comando para el OKR usando DDD
      // El backend espera: OBJECTIVE, KEY_RESULT, o INITIATIVE para type
      // El servicio mapeará COMPANY/TEAM/INDIVIDUAL a OBJECTIVE
      const command: CreateOkrCommand = {
        projectId: projectId, // El servicio lo convierte a string internamente
        title,
        description: description || undefined,
        type: 'TEAM', // COMPANY, TEAM, o INDIVIDUAL (el servicio lo mapeará a OBJECTIVE)
        ownerId,
        quarter,
        status: 'NOT_STARTED',
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }

      // Crear el OKR usando el servicio DDD
      const newOkr = await createOkr(command)
      
      // Crear los key results después de crear el OKR
      // Filtrar solo los key results que tienen título (los válidos)
      const validKeyResults = keyResults.filter(kr => kr.title && kr.title.trim() !== '')
      
      if (validKeyResults.length > 0 && newOkr.id) {
        // Mapear status del frontend al backend
        const mapStatusToBackend = (frontendStatus: string): string => {
          const statusLower = frontendStatus?.toLowerCase() || 'not_started'
          if (statusLower === 'not_started' || statusLower === 'not-started') return 'NOT_STARTED'
          if (statusLower === 'in_progress' || statusLower === 'in-progress') return 'IN_PROGRESS'
          if (statusLower === 'completed') return 'COMPLETED'
          if (statusLower === 'at_risk' || statusLower === 'at-risk') return 'CANCELLED'
          return 'NOT_STARTED'
        }
        
        // Crear cada key result
        const keyResultPromises = validKeyResults.map(async (kr) => {
          const keyResultCommand: CreateKeyResultCommand = {
            okrId: newOkr.id,
            title: kr.title!,
            description: kr.description || undefined,
            targetValue: kr.targetValue || 0,
            currentValue: kr.currentValue || 0,
            unit: kr.unit || 'percentage',
            status: mapStatusToBackend(kr.status || 'not_started')
          }
          
          return okrService.createKeyResult(keyResultCommand)
        })
        
        try {
          await Promise.all(keyResultPromises)
          console.log(`Se crearon ${validKeyResults.length} key results para el OKR ${newOkr.id}`)
        } catch (keyResultError) {
          console.error('Error al crear key results:', keyResultError)
          // No fallar la creación del OKR si fallan los key results
          toast({
            title: "Advertencia",
            description: "El OKR se creó pero algunos key results no se pudieron crear",
            variant: "destructive"
          })
        }
      }
      
      console.log("Nuevo OKR creado:", newOkr)
      
      toast({
        title: "OKR creado exitosamente",
        description: `El objetivo "${title}" ha sido agregado al proyecto ${projectName}`,
      })

      // Resetear formulario
      setTitle("")
      setDescription("")
      setOwnerId("")
      setQuarter("")
      setStartDate("")
      setEndDate("")
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el OKR'
      toast({
        title: "Error al crear OKR",
        description: errorMessage,
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