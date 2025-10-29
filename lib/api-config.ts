// Configuración de la API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Constante para uso en imports que no soportan optional chaining
export const API_BASE = API_BASE_URL

// Helper para crear URLs de API
export function createApiUrl(endpoint: string): string {
  const base = API_BASE_URL
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL no está configurada')
  }
  return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

// Helper para manejar errores de API
export async function apiRequest(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options)
    
    // Si no es exitosa, lanzar error con mensaje descriptivo
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      // Intentar obtener mensaje de error del servidor
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } else {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
      } catch {
        // Si falla al parsear el error, usar mensaje por defecto
      }
      
      throw new Error(errorMessage)
    }
    
    return response
  } catch (error) {
    console.error('API Request failed:', {
      url,
      method: options?.method || 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

// Helper para hacer requests JSON con validación automática
export async function apiRequestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await apiRequest(url, options)
  
  // Validar que la respuesta sea JSON
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType || 'unknown content-type'}`)
  }
  
  return response.json()
}