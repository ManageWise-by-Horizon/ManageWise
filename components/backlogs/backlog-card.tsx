"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Eye, ListTodo } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Backlog {
  id: string
  projectId: string
  projectName: string
  type: "product" | "sprint"
  items: string[]
  createdAt: string
  status: string
}

interface BacklogCardProps {
  backlog: Backlog
  onUpdate: () => void
}

export function BacklogCard({ backlog, onUpdate }: BacklogCardProps) {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/backlogs/${backlog.id}`, {
        method: "DELETE",
      })

      toast({
        title: "Backlog eliminado",
        description: "El backlog ha sido eliminado exitosamente",
      })

      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting backlog:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el backlog",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-chart-1" />
              <Badge variant={backlog.type === "product" ? "default" : "secondary"}>
                {backlog.type === "product" ? "Product Backlog" : "Sprint Backlog"}
              </Badge>
            </div>
            <CardTitle className="mt-2">{backlog.projectName}</CardTitle>
            <CardDescription className="mt-1">Creado el {formatDate(backlog.createdAt)}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/backlogs/${backlog.id}`}>
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items en backlog</span>
          <span className="font-semibold">{backlog.items?.length || 0}</span>
        </div>

        <Link href={`/backlogs/${backlog.id}`}>
          <Button className="w-full bg-transparent" variant="outline">
            Ver User Stories
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
