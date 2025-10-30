"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { createApiUrl, API_BASE_URL } from "@/lib/api-config"
import { cascadeDeleteProject } from "@/lib/cascade-delete"

interface DeleteProjectDialogProps {
  project: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const [projectName, setProjectName] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const isNameMatch = projectName === project.name
  const canDelete = isNameMatch && !isDeleting

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)

    try {
      // Use cascade delete to remove all related entities
      const result = await cascadeDeleteProject({
        projectId: project.id,
        apiUrl: API_BASE_URL,
        currentUserId: user?.id,
        onProgress: (entity, count) => {
          // Progress tracking
        },
        onError: (entity, error) => {
          console.error(`Error deleting ${entity}:`, error)
        }
      })

      if (!result.success) {
        throw new Error(`Cascade delete failed with ${result.errors.length} errors`)
      }

      const notificationMessage = result.notifiedMembers > 0 
        ? ` Se notificó a ${result.notifiedMembers} miembro(s) del proyecto.`
        : '';

      toast({
        title: "Proyecto eliminado",
        description: `El proyecto y todos sus datos han sido eliminados: ${result.deletedEntities.userStories} User Stories, ${result.deletedEntities.tasks} Tasks, ${result.deletedEntities.sprints} Sprints, ${result.deletedEntities.backlogs} Backlogs, ${result.deletedEntities.okrs} OKRs, ${result.deletedEntities.notifications} Notificaciones.${notificationMessage}`,
      })

      // Reset state
      setProjectName("")
      onOpenChange(false)

      // Call success callback
      if (onSuccess) {
        onSuccess()
      } else {
        // Refresh the page if no callback provided
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isDeleting) {
      setProjectName("")
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Proyecto
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive" className="border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¡Advertencia!</strong> Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto{" "}
              <strong className="font-semibold text-destructive">{project.name}</strong> y todos sus datos relacionados:
            </AlertDescription>
          </Alert>

          <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Todas las User Stories del proyecto</li>
            <li>Todas las Tareas asociadas</li>
            <li>Todos los Sprints</li>
            <li>Todos los OKRs</li>
            <li>Todos los Backlogs</li>
            <li>Historial del proyecto</li>
            <li>Invitaciones pendientes</li>
          </ul>

          <div className="space-y-2 pt-2">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Para confirmar, escribe el nombre del proyecto:{" "}
              <span className="font-semibold text-foreground">{project.name}</span>
            </Label>
            <Input
              id="project-name"
              type="text"
              placeholder="Escribe el nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={!canDelete}
            className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar proyecto"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
