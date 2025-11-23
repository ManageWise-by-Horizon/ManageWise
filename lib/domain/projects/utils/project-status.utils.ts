/**
 * Utilidades para trabajar con estados de proyectos
 */

export type ProjectStatus = 
  | 'draft' 
  | 'planning'
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'archived'

/**
 * Traduce el estado del proyecto al español
 */
export function getProjectStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Desconocido'
  
  const statusLower = status.toLowerCase()
  
  const statusLabels: Record<string, string> = {
    'draft': 'Borrador',
    'planning': 'Planificación',
    'active': 'Activo',
    'paused': 'Pausado',
    'completed': 'Completado',
    'cancelled': 'Cancelado',
    'archived': 'Archivado',
  }
  
  return statusLabels[statusLower] || status
}

/**
 * Obtiene el color del badge según el estado del proyecto
 */
export function getProjectStatusBadgeVariant(status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return 'secondary'
  
  const statusLower = status.toLowerCase()
  
  switch (statusLower) {
    case 'active':
      return 'default'
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'destructive'
    case 'paused':
      return 'secondary'
    case 'archived':
      return 'outline'
    default:
      return 'secondary'
  }
}

