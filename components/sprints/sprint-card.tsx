"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Eye, Calendar, ListTodo } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Sprint {
  id: string
  name: string
  projectName: string
  startDate: string
  endDate: string
  goal: string
  tasks: string[]
  status: "planning" | "active" | "completed"
}

interface SprintCardProps {
  sprint: Sprint
  onUpdate: () => void
}

export function SprintCard({ sprint, onUpdate }: SprintCardProps) {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sprints/${sprint.id}`, {
        method: "DELETE",
      })

      toast({
        title: "Sprint eliminado",
        description: "El sprint ha sido eliminado exitosamente",
      })

      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting sprint:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el sprint",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planning: { label: "Planificación", color: "bg-chart-4" },
      active: { label: "Activo", color: "bg-chart-3" },
      completed: { label: "Completado", color: "bg-chart-2" },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: "bg-muted" }
  }

  const statusBadge = getStatusBadge(sprint.status)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-chart-1" />
              <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
            </div>
            <CardTitle className="mt-2 line-clamp-1">{sprint.name}</CardTitle>
            <CardDescription className="mt-1">{sprint.projectName}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sprints/${sprint.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="text-muted-foreground">
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </p>
          <p className="mt-2 line-clamp-2">{sprint.goal}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListTodo className="h-4 w-4" />
            <span>{sprint.tasks.length} tareas</span>
          </div>
        </div>

        <Link href={`/sprints/${sprint.id}`}>
          <Button className="w-full bg-transparent" variant="outline">
            Ver Sprint
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
