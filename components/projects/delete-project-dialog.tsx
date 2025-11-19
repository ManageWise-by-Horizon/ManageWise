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
import { projectService } from "@/lib/domain/projects/services/project.service"

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
      // Validar que el ID del proyecto existe
      if (!project.id || project.id.trim() === '') {
        throw new Error("El ID del proyecto no es válido")
      }

      // Eliminar el proyecto usando el servicio DDD
      // El backend maneja automáticamente la eliminación en cascada de todas las entidades relacionadas
      // (Permissions, Invitations, History, OKRs, KeyResults) gracias a @OneToMany con cascade = CascadeType.ALL
      await projectService.deleteProject(project.id)

      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado correctamente.",
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el proyecto'
      toast({
        title: "Error",
        description: errorMessage,
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
