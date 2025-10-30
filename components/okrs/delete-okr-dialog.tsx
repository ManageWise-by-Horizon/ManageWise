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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Target, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createApiUrl, apiRequest } from "@/lib/api-config"
import { getOKRStatusColor } from "@/lib/ui-helpers"

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
  keyResults: any[]
}

interface DeleteOKRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  okr: OKR | null
  projectName: string
  onOKRDeleted: () => void
}

export function DeleteOKRDialog({
  open,
  onOpenChange,
  okr,
  projectName,
  onOKRDeleted
}: DeleteOKRDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!okr) return

    setLoading(true)
    try {
      // Eliminar el OKR usando la API real
      const url = createApiUrl(`/okrs/${okr.id}`)
      const response = await apiRequest(url, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Error al eliminar el OKR')
      }
      
      toast({
        title: "OKR eliminado exitosamente",
        description: `El objetivo "${okr.title}" ha sido eliminado del proyecto`,
      })

      onOKRDeleted()
      onOpenChange(false)
      
    } catch (error) {
      console.error("Error deleting OKR:", error)
      toast({
        title: "Error al eliminar OKR",
        description: "Hubo un problema al eliminar el objetivo. Inténtalo nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "in_progress":
        return "En progreso"
      case "at_risk":
        return "En riesgo"
      case "not_started":
        return "No iniciado"
      default:
        return "Desconocido"
    }
  }

  if (!okr) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Eliminar OKR
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El objetivo y todos sus resultados clave serán eliminados permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del OKR a eliminar */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{okr.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{okr.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getOKRStatusColor(okr.status)}>
                    {getStatusLabel(okr.status)}
                  </Badge>
                  <Badge variant="outline">{okr.quarter}</Badge>
                  <Badge variant="secondary">{okr.progress}% completado</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Proyecto:</span>
              <span className="font-medium">{projectName}</span>
            </div>
            <div className="flex justify-between">
              <span>Resultados clave:</span>
              <span className="font-medium">{okr.keyResults.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha de creación:</span>
              <span className="font-medium">
                {new Date(okr.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Advertencia */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>¿Estás seguro?</strong> Esta acción eliminará permanentemente el objetivo "{okr.title}" 
              y todos sus {okr.keyResults.length} resultados clave asociados.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
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
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              "Eliminando..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar OKR
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}