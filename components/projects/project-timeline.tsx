"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GanttChart, Rocket, Target, FolderKanban } from "lucide-react"
import { format, parseISO, startOfDay, endOfDay, differenceInDays, isWithinInterval, min, max } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getApiClient } from "@/lib/infrastructure/api/api-client"
import { okrService } from "@/lib/domain/okrs/services/okr.service"
import type { Okr } from "@/lib/domain/okrs/types/okr.types"

interface Sprint {
  id: string
  projectId: string
  title: string
  startDate: string
  endDate: string
  status: string
}

interface TimelineItem {
  id: string
  type: "project" | "sprint" | "okr" | "sprints-group"
  title: string
  startDate: Date
  endDate: Date
  status?: string
  sprints?: Array<{
    id: string
    title: string
    startDate: Date
    endDate: Date
    status: string
  }>
}

interface ProjectTimelineProps {
  projectId: string
  projectName: string
  projectStartDate?: string | null
  projectEndDate?: string | null
}

export function ProjectTimeline({ projectId, projectName, projectStartDate, projectEndDate }: ProjectTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTimelineData()
  }, [projectId, projectStartDate, projectEndDate])

  const loadTimelineData = async () => {
    setIsLoading(true)
    try {
      const items: TimelineItem[] = []
      const apiClient = getApiClient()

      // Obtener sprints del proyecto primero para verificar si hay sprints
      let hasSprints = false
      let sprintsGroupItem: TimelineItem | null = null
      
      try {
        const sprints = await apiClient.get<Sprint[]>(`/api/v1/sprints/project/${projectId}`)
        if (Array.isArray(sprints) && sprints.length > 0) {
          const sprintsWithDates = sprints.filter((sprint) => sprint.startDate && sprint.endDate)
          
          if (sprintsWithDates.length > 0) {
            hasSprints = true
            // Calcular la fecha de inicio más temprana y la fecha de fin más tardía
            const sprintDates = sprintsWithDates.map((sprint) => ({
              start: parseISO(sprint.startDate),
              end: parseISO(sprint.endDate),
            }))
            
            const earliestStart = min(sprintDates.map((d) => d.start))
            const latestEnd = max(sprintDates.map((d) => d.end))
            
            // Crear un item que agrupe todos los sprints con los sprints individuales
            sprintsGroupItem = {
              id: `sprints-group-${projectId}`,
              type: "sprints-group",
              title: `Sprints (${sprintsWithDates.length})`,
              startDate: earliestStart,
              endDate: latestEnd,
              status: undefined,
              sprints: sprintsWithDates.map((sprint) => ({
                id: sprint.id,
                title: sprint.title,
                startDate: parseISO(sprint.startDate),
                endDate: parseISO(sprint.endDate),
                status: sprint.status,
              })),
            }
            items.push(sprintsGroupItem)
          }
        }
      } catch (error) {
        console.error(`Error loading sprints for project ${projectId}:`, error)
      }

      // Agregar proyecto solo si tiene fechas Y no hay sprints (o si las fechas son diferentes)
      if (projectStartDate && projectEndDate) {
        const projectStart = parseISO(projectStartDate)
        const projectEnd = parseISO(projectEndDate)
        
        // Solo agregar el proyecto si no hay sprints, o si las fechas del proyecto son diferentes a las de los sprints
        if (!hasSprints || !sprintsGroupItem || 
            projectStart.getTime() !== sprintsGroupItem.startDate.getTime() || 
            projectEnd.getTime() !== sprintsGroupItem.endDate.getTime()) {
          items.push({
            id: `project-${projectId}`,
            type: "project",
            title: projectName,
            startDate: projectStart,
            endDate: projectEnd,
          })
        }
      }

      // Obtener OKRs del proyecto
      try {
        const okrs = await okrService.getOkrsByProjectId(projectId)
        if (Array.isArray(okrs)) {
          okrs.forEach((okr: Okr) => {
            if (okr.startDate && okr.endDate) {
              items.push({
                id: String(okr.id),
                type: "okr",
                title: okr.title,
                startDate: parseISO(okr.startDate),
                endDate: parseISO(okr.endDate),
                status: okr.status,
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error loading OKRs for project ${projectId}:`, error)
      }


      // Filtrar solo items válidos antes de establecer el estado
      const validItems = items.filter((item) => {
        const validTypes = ["project", "sprints-group", "okr"]
        return validTypes.includes(item.type)
      })
      
      console.log("[ProjectTimeline] Items cargados:", validItems.map(i => ({ id: i.id, type: i.type, title: i.title })))
      
      setTimelineItems(validItems)
    } catch (error) {
      console.error("Error loading timeline data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular el rango de fechas para el timeline
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (timelineItems.length === 0) {
      const today = new Date()
      return {
        timelineStart: today,
        timelineEnd: today,
        totalDays: 0,
      }
    }

    const allDates = timelineItems.flatMap((item) => [item.startDate, item.endDate])
    const minDate = min(allDates)
    const maxDate = max(allDates)
    const days = differenceInDays(maxDate, minDate) + 1

    return {
      timelineStart: startOfDay(minDate),
      timelineEnd: endOfDay(maxDate),
      totalDays: days,
    }
  }, [timelineItems])

  // Calcular posición y ancho de cada item
  const getItemStyle = (item: TimelineItem) => {
    const daysFromStart = differenceInDays(item.startDate, timelineStart)
    const itemDuration = differenceInDays(item.endDate, item.startDate) + 1
    const leftPercent = (daysFromStart / totalDays) * 100
    const widthPercent = (itemDuration / totalDays) * 100

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    }
  }

  // Generar días del timeline para el header
  const timelineDays = useMemo(() => {
    const days: Date[] = []
    let currentDate = new Date(timelineStart)
    while (currentDate <= timelineEnd) {
      days.push(new Date(currentDate))
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
    }
    return days
  }, [timelineStart, timelineEnd])

  const getTypeColor = (type: TimelineItem["type"], status?: string) => {
    switch (type) {
      case "project":
        return "bg-gradient-to-r from-orange-500 to-orange-600"
      case "sprint":
      case "sprints-group":
        if (status === "COMPLETED" || status === "DONE") {
          return "bg-gradient-to-r from-blue-400 to-blue-500"
        }
        return "bg-gradient-to-r from-blue-500 to-blue-600"
      case "okr":
        if (status === "COMPLETED" || status === "DONE") {
          return "bg-gradient-to-r from-green-400 to-green-500"
        }
        return "bg-gradient-to-r from-green-500 to-green-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  const getTypeIcon = (type: TimelineItem["type"]) => {
    switch (type) {
      case "project":
        return <FolderKanban className="h-4 w-4" />
      case "sprint":
      case "sprints-group":
        return <Rocket className="h-4 w-4" />
      case "okr":
        return <Target className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: TimelineItem["type"]) => {
    switch (type) {
      case "project":
        return "Proyecto"
      case "sprint":
      case "sprints-group":
        return "Sprint"
      case "okr":
        return "OKR"
    }
  }

  // Calcular posición y ancho de un sprint individual dentro del grupo
  const getSprintSegmentStyle = (sprint: { startDate: Date; endDate: Date }, groupStart: Date, groupEnd: Date, groupStyle: { left: string; width: string }) => {
    const groupLeft = parseFloat(groupStyle.left)
    const groupWidth = parseFloat(groupStyle.width)
    const groupDuration = differenceInDays(groupEnd, groupStart) + 1
    
    const sprintStartInGroup = differenceInDays(sprint.startDate, groupStart)
    const sprintDuration = differenceInDays(sprint.endDate, sprint.startDate) + 1
    
    const leftInGroup = (sprintStartInGroup / groupDuration) * 100
    const widthInGroup = (sprintDuration / groupDuration) * 100
    
    return {
      left: `${leftInGroup}%`,
      width: `${widthInGroup}%`,
    }
  }

  // Obtener color para cada sprint individual (diferentes tonos de azul)
  const getSprintColor = (index: number, total: number, status?: string) => {
    if (status === "COMPLETED" || status === "DONE") {
      // Colores más claros para sprints completados
      const colors = [
        "bg-gradient-to-r from-blue-300 to-blue-400",
        "bg-gradient-to-r from-cyan-300 to-cyan-400",
        "bg-gradient-to-r from-sky-300 to-sky-400",
        "bg-gradient-to-r from-indigo-300 to-indigo-400",
        "bg-gradient-to-r from-teal-300 to-teal-400",
      ]
      return colors[index % colors.length]
    } else {
      // Colores más vibrantes para sprints activos
      const colors = [
        "bg-gradient-to-r from-blue-500 to-blue-600",
        "bg-gradient-to-r from-cyan-500 to-cyan-600",
        "bg-gradient-to-r from-sky-500 to-sky-600",
        "bg-gradient-to-r from-indigo-500 to-indigo-600",
        "bg-gradient-to-r from-teal-500 to-teal-600",
        "bg-gradient-to-r from-blue-600 to-blue-700",
        "bg-gradient-to-r from-cyan-600 to-cyan-700",
      ]
      return colors[index % colors.length]
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Cargando timeline...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <GanttChart className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No hay datos para mostrar</h3>
          <p className="text-sm text-muted-foreground">
            Agrega sprints u OKRs con fechas para ver el timeline
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="h-5 w-5" />
            Timeline de {projectName}
          </CardTitle>
          <CardDescription>
            Visualización temporal de sprints, OKRs y fechas del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Header con fechas */}
            <div className="relative">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{format(timelineStart, "d MMM yyyy", { locale: es })}</span>
                <span>{format(timelineEnd, "d MMM yyyy", { locale: es })}</span>
              </div>
              
              {/* Grid de días */}
              <div className="relative h-8 border border-border rounded-lg overflow-hidden bg-muted/30">
                {timelineDays.map((day, index) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                  return (
                    <div
                      key={index}
                      className={cn(
                        "absolute top-0 bottom-0 border-r border-border/50",
                        isWeekend && "bg-muted/50",
                        isToday && "bg-primary/10 border-primary/30"
                      )}
                      style={{
                        left: `${(index / timelineDays.length) * 100}%`,
                        width: `${(1 / timelineDays.length) * 100}%`,
                      }}
                    >
                      {index % Math.ceil(timelineDays.length / 10) === 0 && (
                        <div className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(day, "d MMM", { locale: es })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {/* Indicador de hoy */}
                {isWithinInterval(new Date(), { start: timelineStart, end: timelineEnd }) && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{
                      left: `${(differenceInDays(new Date(), timelineStart) / totalDays) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Items del timeline */}
            <div className="space-y-3">
              {timelineItems
                .filter((item) => {
                  // Solo mostrar items válidos: project, sprints-group, okr
                  const validTypes = ["project", "sprints-group", "okr"]
                  if (!validTypes.includes(item.type)) {
                    return false
                  }
                  // Filtrar items con duración válida (al menos 1 día)
                  const duration = differenceInDays(item.endDate, item.startDate) + 1
                  return duration > 0 && !isNaN(duration)
                })
                .sort((a, b) => {
                  // Ordenar: 1. Proyecto, 2. Sprints, 3. OKRs
                  const order: Record<string, number> = {
                    "project": 1,
                    "sprints-group": 2,
                    "okr": 3,
                  }
                  return (order[a.type] || 999) - (order[b.type] || 999)
                })
                .map((item) => {
                  const style = getItemStyle(item)
                  const duration = differenceInDays(item.endDate, item.startDate) + 1
                  const widthPercent = parseFloat(style.width)
                  
                  // No mostrar si el ancho es 0 o inválido
                  if (widthPercent <= 0 || isNaN(widthPercent)) {
                    return null
                  }
                  
                  return (
                    <div key={item.id} className="relative">
                      <div className="flex items-center gap-4 mb-2">
                        <div className={cn("p-2 rounded-lg text-white", getTypeColor(item.type, item.status))}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{item.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(item.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(item.startDate, "d MMM", { locale: es })} - {format(item.endDate, "d MMM yyyy", { locale: es })} ({duration} {duration === 1 ? "día" : "días"})
                          </p>
                        </div>
                      </div>
                      
                      {/* Barra del timeline */}
                      <div className="relative h-12 border border-border rounded-lg overflow-hidden bg-muted/20">
                        {item.type === "sprints-group" && item.sprints ? (
                          // Barra de grupo de sprints con segmentos individuales
                          <div
                            className="absolute top-0 bottom-0 rounded-md shadow-sm transition-all duration-200 bg-muted/10 border-2 border-blue-400/30"
                            style={style}
                          >
                            {/* Segmentos individuales de cada sprint con colores diferentes */}
                            {item.sprints.map((sprint, sprintIndex) => {
                              const segmentStyle = getSprintSegmentStyle(sprint, item.startDate, item.endDate, style)
                              const segmentWidth = parseFloat(segmentStyle.width)
                              const sprintColor = getSprintColor(sprintIndex, item.sprints!.length, sprint.status)
                              return (
                                <div
                                  key={sprint.id}
                                  className={cn(
                                    "absolute top-0.5 bottom-0.5 rounded-sm border-r-2 border-white/20 last:border-r-0 transition-all duration-200 hover:brightness-110 hover:scale-[1.02] cursor-pointer shadow-sm",
                                    sprintColor
                                  )}
                                  style={segmentStyle}
                                  title={`${sprint.title}: ${format(sprint.startDate, "d MMM", { locale: es })} - ${format(sprint.endDate, "d MMM yyyy", { locale: es })}`}
                                >
                                  {segmentWidth > 8 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-white text-[10px] font-semibold truncate px-1 drop-shadow-sm">
                                        {sprint.title}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          // Barra normal para otros items
                          <div
                            className={cn(
                              "absolute top-0 bottom-0 rounded-md shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer flex items-center justify-center text-white text-xs font-medium",
                              getTypeColor(item.type, item.status)
                            )}
                            style={style}
                            title={`${item.title}: ${format(item.startDate, "d MMM", { locale: es })} - ${format(item.endDate, "d MMM yyyy", { locale: es })}`}
                          >
                            {widthPercent > 10 && (
                              <span className="truncate px-2">{item.title}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Leyenda */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-3">Leyenda</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-orange-600"></div>
                  <span className="text-sm">Proyecto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <span className="text-sm">Sprint</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-green-600"></div>
                  <span className="text-sm">OKR</span>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

