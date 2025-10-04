"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Edit, Sparkles, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string[]
  priority: "high" | "medium" | "low"
  storyPoints: number
  status: string
  aiGenerated?: boolean
  qualityMetrics?: {
    bleu: number
    rouge: number
  }
}

interface UserStoryCardProps {
  story: UserStory
  onUpdate: () => void
}

export function UserStoryCard({ story, onUpdate }: UserStoryCardProps) {
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/userStories/${story.id}`, {
        method: "DELETE",
      })

      toast({
        title: "User Story eliminada",
        description: "La user story ha sido eliminada exitosamente",
      })

      onUpdate()
    } catch (error) {
      console.error("[v0] Error deleting user story:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la user story",
        variant: "destructive",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-chart-5 text-white",
      medium: "bg-chart-4 text-white",
      low: "bg-chart-2 text-white",
    }
    return colors[priority as keyof typeof colors] || "bg-muted"
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: "Alta",
      medium: "Media",
      low: "Baja",
    }
    return labels[priority as keyof typeof labels] || priority
  }

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(story.priority)}>{getPriorityLabel(story.priority)}</Badge>
              <Badge variant="outline">{story.storyPoints} pts</Badge>
              {story.aiGenerated && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  IA
                </Badge>
              )}
            </div>
            <CardTitle className="mt-2">{story.title}</CardTitle>
            <CardDescription className="mt-2">{story.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Editar
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
        {/* Acceptance Criteria */}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Criterios de Aceptación</h4>
          <ul className="space-y-1">
            {story.acceptanceCriteria.map((criteria, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-chart-3" />
                <span>{criteria}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quality Metrics */}
        {story.aiGenerated && story.qualityMetrics && (
          <div className="flex items-center gap-4 rounded-lg border border-chart-1/20 bg-chart-1/5 p-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">BLEU Score</p>
              <p className="text-lg font-bold">{(story.qualityMetrics.bleu * 100).toFixed(1)}%</p>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">ROUGE Score</p>
              <p className="text-lg font-bold">{(story.qualityMetrics.rouge * 100).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
