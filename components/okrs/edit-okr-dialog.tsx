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
import { useOkr } from "@/lib/domain/okrs/hooks/use-okr"
import { okrService } from "@/lib/domain/okrs/services/okr.service"
import type { UpdateOkrCommand, CreateKeyResultCommand, UpdateKeyResultCommand } from "@/lib/domain/okrs/types/okr.types"
import { useAuth } from "@/lib/auth/auth-context"
import { useNotifications } from "@/hooks/use-notifications"

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
  const { user } = useAuth()
  const { createNotification } = useNotifications()
  const [loading, setLoading] = useState(false)
  
  // Usar el hook useOkr con el ID del OKR (string)
  const { updateOkr } = useOkr(okr?.id ? String(okr.id) : undefined)
  
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
  
  // Guardar valores originales para detectar cambios
  const [originalProgress, setOriginalProgress] = useState(0)

  // Función para mapear el status del backend al frontend
  const mapStatusToFrontend = (backendStatus: string): "not_started" | "in_progress" | "completed" | "at_risk" => {
    if (!backendStatus) return 'not_started'
    const statusLower = backendStatus.toLowerCase().trim()
    // Mapear estados del backend (NOT_STARTED, IN_PROGRESS, etc.) al formato del frontend
    if (statusLower === 'not_started' || statusLower === 'not-started' || statusLower === 'notstarted') return 'not_started'
    if (statusLower === 'in_progress' || statusLower === 'in-progress' || statusLower === 'inprogress') return 'in_progress'
    if (statusLower === 'completed' || statusLower === 'complete') return 'completed'
    if (statusLower === 'at_risk' || statusLower === 'at-risk' || statusLower === 'atrisk' || 
        statusLower === 'cancelled' || statusLower === 'canceled' || 
        statusLower === 'on_hold' || statusLower === 'on-hold' || statusLower === 'onhold') return 'at_risk'
    // Si ya está en el formato correcto, devolverlo
    // Validar que sea uno de los valores permitidos
    if (['not_started', 'in_progress', 'completed', 'at_risk'].includes(statusLower)) {
      return statusLower as "not_started" | "in_progress" | "completed" | "at_risk"
    }
    // Por defecto, retornar not_started
    console.warn(`Estado desconocido recibido: ${backendStatus}, usando 'not_started' por defecto`)
    return 'not_started'
  }

  // Cargar datos del OKR cuando se abre el diálogo
  useEffect(() => {
    if (okr && open) {
      const mappedStatus = mapStatusToFrontend(okr.status)
      console.log('Cargando OKR:', { originalStatus: okr.status, mappedStatus })
      
      setTitle(okr.title)
      setDescription(okr.description)
      setOwnerId(okr.ownerId)
      setQuarter(okr.quarter)
      setStatus(mappedStatus)
      setStartDate(okr.startDate)
      setEndDate(okr.endDate)
      // Cargar key results, asegurándonos de que tengan IDs válidos
      const loadedKeyResults = okr.keyResults && okr.keyResults.length > 0
        ? okr.keyResults.map(kr => ({
            ...kr,
            id: kr.id || `kr_${Math.random().toString(36).substr(2, 4)}`, // Asegurar que tenga ID
            status: mapStatusToFrontend(kr.status)
          }))
        : [{
            id: `kr_${Math.random().toString(36).substr(2, 4)}`,
            title: "",
            description: "",
            targetValue: 0,
            currentValue: 0,
            unit: "percentage",
            status: "not_started" as const
          }]
      setKeyResults(loadedKeyResults)
      setOriginalProgress(okr.progress)
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
      // Validar que el ID del OKR existe
      if (!okr.id || String(okr.id).trim() === '') {
        throw new Error('El ID del OKR no es válido.')
      }

      const okrId = String(okr.id)

      // Mapear status del frontend al backend
      const statusMap: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
        'not_started': 'NOT_STARTED',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
        'at_risk': 'IN_PROGRESS' // Mapear at_risk a IN_PROGRESS
      }

      // Crear el comando para actualizar el OKR usando DDD
      const command: UpdateOkrCommand = {
        title,
        description: description || undefined,
        status: statusMap[status] || 'NOT_STARTED',
        progress: calculateProgress(),
        startDate: startDate || undefined,
        endDate: endDate || undefined
      }

      // Usar la función updateOkr del hook
      const updatedOkr = await updateOkr(okrId, command)
      
      console.log("OKR actualizado:", updatedOkr)
      
      // Gestionar key results: crear nuevos, actualizar existentes, eliminar removidos
      if (okr && okrId) {
        try {
          // Obtener key results originales del OKR
          const originalKeyResults = okr.keyResults || []
          const originalKeyResultIds = new Set(
            originalKeyResults
              .map(kr => String(kr.id))
              .filter(id => id && id.trim() !== '')
          )
          
          // Mapear status del frontend al backend
          const mapStatusToBackend = (frontendStatus: string): string => {
            const statusLower = frontendStatus?.toLowerCase() || 'not_started'
            if (statusLower === 'not_started' || statusLower === 'not-started') return 'NOT_STARTED'
            if (statusLower === 'in_progress' || statusLower === 'in-progress') return 'IN_PROGRESS'
            if (statusLower === 'completed') return 'COMPLETED'
            if (statusLower === 'at_risk' || statusLower === 'at-risk') return 'CANCELLED'
            return 'NOT_STARTED'
          }
          
          // Filtrar solo key results válidos (con título)
          const validKeyResults = keyResults.filter(kr => kr.title && kr.title.trim() !== '')
          
          // Identificar key results nuevos (IDs temporales) y existentes (IDs string)
          const newKeyResults: typeof validKeyResults = []
          const existingKeyResults: typeof validKeyResults = []
          
          validKeyResults.forEach(kr => {
            const krId = String(kr.id)
            if (krId && krId.trim() !== '' && originalKeyResultIds.has(krId)) {
              existingKeyResults.push(kr)
            } else {
              newKeyResults.push(kr)
            }
          })
          
          // Crear nuevos key results
          if (newKeyResults.length > 0) {
            const createPromises = newKeyResults.map(async (kr) => {
              const keyResultCommand: CreateKeyResultCommand = {
                okrId: okrId,
                title: kr.title,
                description: kr.description || undefined,
                targetValue: kr.targetValue || 0,
                currentValue: kr.currentValue || 0,
                unit: kr.unit || 'percentage',
                status: mapStatusToBackend(kr.status || 'not_started')
              }
              return okrService.createKeyResult(keyResultCommand)
            })
            await Promise.all(createPromises)
            console.log(`Se crearon ${newKeyResults.length} nuevos key results`)
          }
          
          // Actualizar key results existentes
          if (existingKeyResults.length > 0) {
            const updatePromises = existingKeyResults.map(async (kr) => {
              const krId = String(kr.id)
              if (krId && krId.trim() !== '') {
                const updateCommand: UpdateKeyResultCommand = {
                  title: kr.title,
                  description: kr.description || undefined,
                  targetValue: kr.targetValue || 0,
                  currentValue: kr.currentValue || 0,
                  unit: kr.unit || 'percentage',
                  status: mapStatusToBackend(kr.status || 'not_started')
                }
                return okrService.updateKeyResult(krId, updateCommand)
              }
            })
            await Promise.all(updatePromises.filter(p => p !== undefined))
            console.log(`Se actualizaron ${existingKeyResults.length} key results existentes`)
          }
          
          // Identificar key results que fueron eliminados
          const currentKeyResultIds = new Set(
            validKeyResults
              .map(kr => String(kr.id))
              .filter(id => id && id.trim() !== '')
          )
          
          const deletedKeyResultIds = Array.from(originalKeyResultIds).filter(
            id => !currentKeyResultIds.has(id)
          )
          
          // Eliminar key results removidos
          if (deletedKeyResultIds.length > 0) {
            const deletePromises = deletedKeyResultIds.map(id => okrService.deleteKeyResult(id))
            await Promise.all(deletePromises)
            console.log(`Se eliminaron ${deletedKeyResultIds.length} key results`)
          }
        } catch (keyResultError) {
          console.error('Error al gestionar key results:', keyResultError)
          toast({
            title: "Advertencia",
            description: "El OKR se actualizó pero hubo problemas al guardar algunos key results",
            variant: "destructive"
          })
        }
      }
      
      // Crear notificación si el progreso cambió significativamente (más de 5%)
      const newProgress = calculateProgress()
      const progressChange = Math.abs(newProgress - originalProgress)
      
      if (progressChange >= 5 && user && okr) {
        try {
          // Obtener miembros del proyecto para notificar
          // TODO: Usar el servicio de proyectos DDD para obtener miembros
          // Por ahora, usar los miembros que ya tenemos en props
          let membersToNotify = members.map(m => m.id)
          
          if (membersToNotify.length === 0) {
            // Si no hay miembros, notificar al menos al owner del OKR
            membersToNotify = [okr.ownerId]
          }

          // Crear notificaciones para cada miembro (excepto quien hizo el cambio)
          const notificationPromises = membersToNotify
            .filter((userId: string) => userId !== user.id)
            .map(async (userId: string) => {
              await createNotification({
                userId,
                projectId: okr.projectId,
                type: 'okr_updated',
                title: 'OKR actualizado',
                message: `El OKR "${title}" ha sido actualizado - Progreso: ${newProgress}%`,
                data: {
                  okrId: okr.id,
                  okrTitle: title,
                  changeType: 'progress_updated',
                  oldProgress: originalProgress,
                  newProgress: newProgress,
                  changedBy: user.id,
                  projectId: okr.projectId,
                  projectName: projectName
                }
              })
            })
          
          await Promise.all(notificationPromises)
        } catch (notificationError) {
          console.error('Error creating OKR update notifications:', notificationError)
          // No fallar la actualización por errores de notificación
        }
      }
      
      toast({
        title: "OKR actualizado exitosamente",
        description: `El objetivo "${title}" ha sido actualizado`,
      })

      onOKRUpdated()
      onOpenChange(false)
      
    } catch (error) {
      console.error("Error updating OKR:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar el OKR'
      toast({
        title: "Error al actualizar OKR",
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
                <Select 
                  value={status || 'not_started'} 
                  onValueChange={(value: any) => {
                    console.log('Cambiando estado de', status, 'a', value)
                    setStatus(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado">
                      {STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'Seleccionar estado'}
                    </SelectValue>
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