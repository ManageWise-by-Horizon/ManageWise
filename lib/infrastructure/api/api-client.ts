// Cliente API base con autenticación
import { API_BASE_URL } from '@/lib/api-config'

export interface ApiClientConfig {
  baseUrl?: string
  getAuthToken?: () => string | null
}

export class ApiClient {
  private baseUrl: string
  private getAuthToken?: () => string | null

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || API_BASE_URL
    this.getAuthToken = config.getAuthToken
  }

  private getHeaders(additionalHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(additionalHeaders && typeof additionalHeaders === 'object' && !Array.isArray(additionalHeaders) && !(additionalHeaders instanceof Headers)
        ? additionalHeaders as Record<string, string>
        : {})
    }

    // Agregar token de autenticación si está disponible
    if (this.getAuthToken) {
      const token = this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers: this.getHeaders(options?.headers)
      })

      // Leer el cuerpo una sola vez
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        // Si es un error, intentar parsear el mensaje de error
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        if (text && text.trim() !== '') {
          if (contentType?.includes('application/json')) {
            try {
              const errorData = JSON.parse(text)
              errorMessage = errorData.message || errorData.error || errorMessage
            } catch {
              errorMessage = text
            }
          } else {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }

      // Si la respuesta es exitosa, intentar parsear como JSON
      if (!text || text.trim() === '') {
        return {} as T
      }

      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(text) as T
        } catch (parseError) {
          throw new Error(`Respuesta no válida del servidor: ${text.substring(0, 100)}`)
        }
      } else {
        // Si no es JSON pero la respuesta es exitosa, devolver objeto vacío
        return {} as T
      }
    } catch (error) {
      // Capturar errores de red (Failed to fetch, CORS, etc.)
      if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
          throw new Error(`No se pudo conectar con el servidor. Verifica que el Gateway esté corriendo en ${this.baseUrl}`)
        }
      }
      // Si el error ya es un Error con mensaje, propagarlo
      if (error instanceof Error) {
        throw error
      }
      // Para otros tipos de errores, crear un Error genérico
      throw new Error(`Error desconocido: ${String(error)}`)
    }
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: this.getHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined
      })

      // Leer el cuerpo una sola vez
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        // Si es un error, intentar parsear el mensaje de error
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails: any = null
        
        console.error('[ApiClient] POST error response status:', response.status)
        console.error('[ApiClient] POST error response body (raw):', text)
        
        if (text && text.trim() !== '') {
          if (contentType?.includes('application/json')) {
            try {
              const errorData = JSON.parse(text)
              errorDetails = errorData
              errorMessage = errorData.message || errorData.error || errorData.detail || errorData.localizedMessage || errorMessage
              console.error('[ApiClient] POST error response (parsed):', errorData)
            } catch {
              errorMessage = text
              console.error('[ApiClient] POST error response (text):', text)
            }
          } else {
            errorMessage = text
            console.error('[ApiClient] POST error response (text, non-JSON):', text)
          }
        }
        
        // Crear un error con más información
        const error = new Error(errorMessage) as any
        error.status = response.status
        error.statusText = response.statusText
        error.details = errorDetails
        error.responseText = text
        throw error
      }

      // Si la respuesta es exitosa, intentar parsear como JSON
      if (!text || text.trim() === '') {
        return {} as T
      }

      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(text) as T
        } catch (parseError) {
          throw new Error(`Respuesta no válida del servidor: ${text.substring(0, 100)}`)
        }
      } else {
        // Si no es JSON pero la respuesta es exitosa, devolver objeto vacío
        // (algunos endpoints pueden devolver 204 No Content)
        return {} as T
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el Gateway esté corriendo en ${this.baseUrl}`)
      }
      throw error
    }
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        headers: this.getHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        await this.handleError(response)
      }

      // Verificar si hay contenido antes de parsear JSON
      const contentType = response.headers.get('content-type')
      const text = await response.text()
      
      if (!text || text.trim() === '') {
        return {} as T
      }

      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(text) as T
        } catch (parseError) {
          throw new Error(`Respuesta no válida del servidor: ${text.substring(0, 100)}`)
        }
      }
      
      return {} as T
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el Gateway esté corriendo en ${this.baseUrl}`)
      }
      throw error
    }
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PATCH',
        headers: this.getHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        await this.handleError(response)
      }

      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el Gateway esté corriendo en ${this.baseUrl}`)
      }
      throw error
    }
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'DELETE',
        headers: this.getHeaders(options?.headers)
      })

      // Leer el cuerpo una sola vez
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        // Si es un error, intentar parsear el mensaje de error
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        if (text && text.trim() !== '') {
          if (contentType?.includes('application/json')) {
            try {
              const errorData = JSON.parse(text)
              errorMessage = errorData.message || errorData.error || errorMessage
            } catch {
              errorMessage = text
            }
          } else {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
      }

      // Para DELETE, puede que no haya contenido o sea texto plano
      if (response.status === 204 || !text || text.trim() === '') {
        return {} as T
      }

      // Si hay contenido, verificar si es JSON
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(text) as T
        } catch (parseError) {
          // Si falla el parseo, devolver objeto vacío (el backend puede devolver texto plano)
          return {} as T
        }
      } else {
        // Si no es JSON pero la respuesta es exitosa, devolver objeto vacío
        return {} as T
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`No se pudo conectar con el servidor. Verifica que el Gateway esté corriendo en ${this.baseUrl}`)
      }
      throw error
    }
  }

  private async handleError(response: Response): Promise<never> {
    // Este método ya no se usa directamente, pero lo mantenemos por compatibilidad
    // El manejo de errores ahora se hace directamente en cada método HTTP
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorDetails: any = null
    
    try {
      // Clonar la respuesta para poder leer el texto sin consumir el stream
      const text = await response.clone().text()
      console.error('[ApiClient] Error response status:', response.status)
      console.error('[ApiClient] Error response headers:', Object.fromEntries(response.headers.entries()))
      console.error('[ApiClient] Error response body (raw):', text)
      
      if (text && text.trim() !== '') {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            const errorData = JSON.parse(text)
            errorDetails = errorData
            errorMessage = errorData.message || errorData.error || errorData.details || errorData.localizedMessage || text || errorMessage
            console.error('[ApiClient] Error response (parsed):', errorData)
          } catch (parseError) {
            errorMessage = text
            console.error('[ApiClient] Error parsing JSON:', parseError)
            console.error('[ApiClient] Error response (text):', text)
          }
        } else {
          errorMessage = text
          console.error('[ApiClient] Error response (text, non-JSON):', text)
        }
      } else {
        console.error('[ApiClient] Error response body is empty')
      }
    } catch (error) {
      console.error('[ApiClient] Error al leer respuesta de error:', error)
    }

    const finalError = new Error(errorMessage) as any
    finalError.status = response.status
    finalError.statusText = response.statusText
    finalError.details = errorDetails
    throw finalError
  }
}

// Instancia singleton del cliente API
let apiClientInstance: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient({
      getAuthToken: () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('auth_token')
        }
        return null
      }
    })
  }
  return apiClientInstance
}

