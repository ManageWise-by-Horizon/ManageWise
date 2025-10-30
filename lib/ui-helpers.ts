/**
 * Utilidades compartidas para UI - Colores y estilos
 * Consolida funciones repetidas en múltiples componentes
 */

/**
 * Obtiene las clases de color para badges de prioridad
 */
export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }
  return colors[priority] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

/**
 * Obtiene las clases de color para badges de estado de tareas/user stories
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

/**
 * Obtiene las clases de color para badges de estado de OKRs
 */
export const getOKRStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    at_risk: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
}

/**
 * Obtiene la etiqueta legible para prioridades
 */
export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baja",
  }
  return labels[priority] || priority
}

/**
 * Obtiene la etiqueta legible para estados
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    todo: "Por hacer",
    in_progress: "En progreso",
    done: "Hecho",
    completed: "Completado",
    not_started: "No iniciado",
    at_risk: "En riesgo",
  }
  return labels[status] || status
}
