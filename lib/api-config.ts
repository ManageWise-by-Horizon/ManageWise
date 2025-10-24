// Configuración de la API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Helper para crear URLs de API
export function createApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

// Helper para manejar errores de API
export async function apiRequest(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    console.error('API Request failed:', error)
    throw new Error('Error de conexión con el servidor')
  }
}