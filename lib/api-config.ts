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

// Helper para obtener token de autenticación
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Helper para crear headers con autenticación
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
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
    // Solo hacer log en desarrollo o si es un error real
    if (process.env.NODE_ENV === 'development') {
      console.warn(`API Request failed: ${options?.method || 'GET'} ${url}`, 
        error instanceof Error ? error.message : String(error)
      )
    }
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