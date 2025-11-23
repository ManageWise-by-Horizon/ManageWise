// Tipos para Meetings
export interface Meeting {
  id: string
  projectId: string
  title: string
  description: string
  startDate: string
  endDate: string
  url: string
  status: string
  calendarEventId?: string
}

export interface CreateMeetingCommand {
  projectId: string
  title: string
  description: string
  startDate: string
  endDate: string
  status?: string
}

export interface UpdateMeetingCommand {
  id: string
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  status?: string
}

