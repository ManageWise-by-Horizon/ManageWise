"use client"

import { useState, useEffect } from "react"
import { DayPicker } from "react-day-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Rocket, Target, Video, FolderKanban } from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getApiClient } from "@/lib/infrastructure/api/api-client"
import { meetingService } from "@/lib/domain/meetings/services/meeting.service"
import { okrService } from "@/lib/domain/okrs/services/okr.service"
import type { Meeting } from "@/lib/domain/meetings/types/meeting.types"
import type { Okr } from "@/lib/domain/okrs/types/okr.types"
import "react-day-picker/dist/style.css"

interface Sprint {
  id: string
  projectId: string
  title: string
  endDate: string
  status: string
}

interface CalendarEvent {
  date: Date
  type: "sprint" | "okr" | "meeting" | "project"
  title: string
  id: string
}

interface ProjectCalendarProps {
  projectId: string
  projectName: string
  projectEndDate?: string | null
}

export function ProjectCalendar({ projectId, projectName, projectEndDate }: ProjectCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCalendarEvents()
  }, [projectId, projectEndDate])

  const loadCalendarEvents = async () => {
    setIsLoading(true)
    try {
      const allEvents: CalendarEvent[] = []
      const apiClient = getApiClient()

      // Obtener sprints del proyecto
      try {
        const sprints = await apiClient.get<Sprint[]>(`/api/v1/sprints/project/${projectId}`)
        if (Array.isArray(sprints)) {
          sprints.forEach((sprint) => {
            if (sprint.endDate) {
              allEvents.push({
                date: parseISO(sprint.endDate),
                type: "sprint",
                title: sprint.title,
                id: sprint.id,
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error loading sprints for project ${projectId}:`, error)
      }

      // Obtener OKRs del proyecto
      try {
        const okrs = await okrService.getOkrsByProjectId(projectId)
        if (Array.isArray(okrs)) {
          okrs.forEach((okr: Okr) => {
            if (okr.endDate) {
              allEvents.push({
                date: parseISO(okr.endDate),
                type: "okr",
                title: okr.title,
                id: String(okr.id),
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error loading OKRs for project ${projectId}:`, error)
      }

      // Obtener reuniones del proyecto
      try {
        const meetings = await meetingService.getMeetingsByProjectId(projectId)
        if (Array.isArray(meetings)) {
          meetings.forEach((meeting: Meeting) => {
            if (meeting.startDate) {
              allEvents.push({
                date: parseISO(meeting.startDate),
                type: "meeting",
                title: meeting.title,
                id: meeting.id,
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error loading meetings for project ${projectId}:`, error)
      }

      // Agregar fecha de fin del proyecto
      if (projectEndDate) {
        allEvents.push({
          date: parseISO(projectEndDate),
          type: "project",
          title: `Fin de ${projectName}`,
          id: `project-end-${projectId}`,
        })
      }

      setEvents(allEvents)
    } catch (error) {
      console.error("Error loading calendar events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de {projectName}
          </CardTitle>
          <CardDescription>
            Visualiza las fechas de fin de sprints, OKRs, reuniones programadas y fin del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Cargando eventos del calendario...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendario */}
              <div className="flex-1">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={es}
                  className="rounded-md border"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn(
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    ),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  modifiers={{
                    hasEvents: (date) => getEventsForDate(date).length > 0,
                    hasSprint: (date) => getEventsForDate(date).some((e) => e.type === "sprint"),
                    hasOkr: (date) => getEventsForDate(date).some((e) => e.type === "okr"),
                    hasMeeting: (date) => getEventsForDate(date).some((e) => e.type === "meeting"),
                    hasProject: (date) => getEventsForDate(date).some((e) => e.type === "project"),
                  }}
                  modifiersClassNames={{
                    hasEvents: "font-bold",
                    hasSprint: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500",
                    hasOkr: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500",
                    hasMeeting: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-purple-500",
                    hasProject: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-orange-500",
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                  }}
                />
              </div>

              {/* Panel de eventos del día seleccionado */}
              <div className="lg:w-80 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedDate
                      ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
                      : "Selecciona una fecha"}
                  </h3>
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay eventos programados para esta fecha
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event, index) => (
                        <Card key={`${event.id}-${index}`} className="p-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-1 p-2 rounded-full",
                                event.type === "sprint" && "bg-blue-100 dark:bg-blue-900/30",
                                event.type === "okr" && "bg-green-100 dark:bg-green-900/30",
                                event.type === "meeting" && "bg-purple-100 dark:bg-purple-900/30",
                                event.type === "project" && "bg-orange-100 dark:bg-orange-900/30"
                              )}
                            >
                              {event.type === "sprint" && (
                                <Rocket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                              {event.type === "okr" && (
                                <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                              )}
                              {event.type === "meeting" && (
                                <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              )}
                              {event.type === "project" && (
                                <FolderKanban className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{event.title}</p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "mt-2 text-xs",
                                  event.type === "sprint" && "border-blue-300 text-blue-700 dark:text-blue-400",
                                  event.type === "okr" && "border-green-300 text-green-700 dark:text-green-400",
                                  event.type === "meeting" && "border-purple-300 text-purple-700 dark:text-purple-400",
                                  event.type === "project" && "border-orange-300 text-orange-700 dark:text-orange-400"
                                )}
                              >
                                {event.type === "sprint" && "Fin de Sprint"}
                                {event.type === "okr" && "Fin de OKR"}
                                {event.type === "meeting" && "Reunión"}
                                {event.type === "project" && "Fin de Proyecto"}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Leyenda */}
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Leyenda</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30"></div>
                      <span className="text-sm">Fin de Sprint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                      <span className="text-sm">Fin de OKR</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30"></div>
                      <span className="text-sm">Reunión Programada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30"></div>
                      <span className="text-sm">Fin de Proyecto</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

