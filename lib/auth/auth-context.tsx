"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createApiUrl } from "@/lib/api-config"
import { profileService } from "@/lib/domain/profile/services/profile.service"
import type { UserProfile } from "@/lib/domain/profile/types/profile.types"

export type UserRole = "scrum_master" | "product_owner" | "developer"
export type Plan = "free" | "premium"

export interface Subscription {
  plan: Plan
  tokensUsed: number
  tokensLimit: number
  userStoriesUsed: number
  userStoriesLimit: number
  startDate?: string
  endDate?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar: string
  subscription: Subscription
  resume?: {
    skills: string[]
    experience: string
    certifications: string[]
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  isLoading: boolean
  isMounted: boolean
  checkLimits: (type: "tokens" | "userStories", amount?: number) => boolean
  updateUsage: (type: "tokens" | "userStories", amount: number) => void
  updateUser: (user: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  // Evitar hydration mismatch asegurando que solo renderice después del mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Función helper para mapear UserProfile del backend a User del frontend
  const mapProfileToUser = (profile: UserProfile): User => {
    const fullName = `${profile.userFirstName || ''} ${profile.userLastName || ''}`.trim() || profile.userEmail.split('@')[0]
    
    return {
      id: profile.userId,
      email: profile.userEmail,
      name: fullName,
      role: (profile.userRole?.toLowerCase() === 'scrum_master' ? 'scrum_master' : 
             profile.userRole?.toLowerCase() === 'product_owner' ? 'product_owner' : 
             'developer') as UserRole,
      avatar: profile.userProfileImgUrl || `/placeholder.svg?height=40&width=40`,
      subscription: {
        plan: 'free' as Plan, // TODO: Obtener desde Profile-Service cuando esté disponible
        tokensUsed: 0,
        tokensLimit: 100,
        userStoriesUsed: 0,
        userStoriesLimit: 10
      }
    }
  }

  useEffect(() => {
    if (!isMounted) return
    
    // Verificar si hay un usuario autenticado y obtener su perfil desde Profile-Service
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("auth_token")
      const userId = localStorage.getItem("user_id")
      
      if (token && userId) {
        // Obtener el perfil desde Profile-Service en lugar de localStorage
        profileService.getUserProfile({ userId })
          .then((profile) => {
            const userData = mapProfileToUser(profile)
            setUser(userData)
          })
          .catch((error: any) => {
            const is404 = error?.message?.includes('404') || error?.message?.includes('Not Found')
            
            if (is404) {
              // Si el perfil no existe (404), no es necesariamente un error crítico
              // Puede ser que el perfil aún no se haya creado o el usuario fue eliminado
              console.warn("User profile not found (404), user may need to re-login:", error)
              // Limpiar datos para forzar re-login
              localStorage.removeItem("auth_token")
              localStorage.removeItem("user_id")
              localStorage.removeItem("user")
            } else {
              // Para otros errores, loguear y limpiar
              console.error("Error fetching user profile:", error)
              localStorage.removeItem("auth_token")
              localStorage.removeItem("user_id")
              localStorage.removeItem("user")
            }
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [isMounted])

  const login = async (email: string, password: string) => {
    try {
      // Real API call to Gateway
      const response = await fetch(createApiUrl('/api/v1/authentication/sign-in'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: email,
          userPassword: password
        })
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Usuario no encontrado")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error al iniciar sesión: ${response.status}`)
      }

      const authData = await response.json()
      // authData contiene: { userId, userEmail, userToken }

      // Guardar el token JWT real
      if (typeof window !== 'undefined') {
        localStorage.setItem("auth_token", authData.userToken)
        localStorage.setItem("user_id", authData.userId)
      }

      // Obtener el perfil completo del usuario desde Profile-Service con retry
      let profile: UserProfile | null = null
      const maxRetries = 3
      const retryDelay = 500 // 500ms entre intentos
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          profile = await profileService.getUserProfile({ userId: authData.userId })
          break // Si tiene éxito, salir del loop
        } catch (profileError: any) {
          const is404 = profileError?.message?.includes('404') || profileError?.message?.includes('Not Found')
          
          if (is404 && attempt < maxRetries) {
            // Si es 404 y no es el último intento, esperar y reintentar
            console.log(`Profile not found (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)) // Backoff exponencial
            continue
          } else {
            // Si es el último intento o no es 404, usar fallback
            console.warn("Error fetching user profile after login:", profileError)
            profile = null
            break
          }
        }
      }

      if (profile) {
        const userData = mapProfileToUser(profile)
        setUser(userData)
      } else {
        // Si falla obtener el perfil después de todos los intentos, usar datos básicos del auth como fallback
        const userData: User = {
          id: authData.userId,
          email: authData.userEmail,
          name: authData.userEmail.split('@')[0],
          role: 'developer' as UserRole,
          avatar: `/placeholder.svg?height=40&width=40`,
          subscription: {
            plan: 'free' as Plan,
            tokensUsed: 0,
            tokensLimit: 100,
            userStoriesUsed: 0,
            userStoriesLimit: 10
          }
        }
        setUser(userData)
      }
      
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      // Parsear el nombre completo en firstName y lastName
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || name
      const lastName = nameParts.slice(1).join(' ') || name

      // Real API call to Gateway
      const response = await fetch(createApiUrl('/api/v1/authentication/sign-up'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: email,
          userPassword: password,
          userFirstName: firstName,
          userLastName: lastName,
          userPhone: '', // Opcional, puede ser vacío
          userCountry: '' // Opcional, puede ser vacío
        })
      })

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "El correo ya está registrado o los datos son inválidos")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error al registrar usuario: ${response.status}`)
      }

      const createdUser = await response.json()
      // createdUser contiene: { userId, userEmail }

      // Esperar un momento para que el Profile-Service cree el perfil del usuario
      // Esto es necesario porque el perfil puede no estar disponible inmediatamente
      await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo

      // Auto login after registration
      await login(email, password)
    } catch (error) {
      console.error("[v0] Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user") // Mantener por compatibilidad temporal
    }
    setUser(null)
    router.push("/login")
  }

  const checkLimits = (type: "tokens" | "userStories", amount = 1): boolean => {
    if (!user) return false
    if (user.subscription.plan === "premium") return true

    if (type === "tokens") {
      return user.subscription.tokensUsed + amount <= user.subscription.tokensLimit
    } else {
      return user.subscription.userStoriesUsed + amount <= user.subscription.userStoriesLimit
    }
  }

  const updateUsage = async (type: "tokens" | "userStories", amount: number) => {
    if (!user) return

    const updatedUser = { ...user }

    if (type === "tokens") {
      updatedUser.subscription.tokensUsed += amount
    } else {
      updatedUser.subscription.userStoriesUsed += amount
    }

    // TODO: Actualizar en Profile-Service cuando esté disponible el campo subscription
    // Por ahora solo actualizamos el estado local (no se guarda en localStorage)
    setUser(updatedUser)
  }

  const updateUser = async (updatedUser: User) => {
    // Actualizar en Profile-Service
    try {
      // Primero obtener el perfil actual para tener todos los campos requeridos
      const currentProfile = await profileService.getUserProfile({ userId: updatedUser.id })
      
      // Parsear el nombre completo en firstName y lastName
      const nameParts = updatedUser.name.trim().split(' ')
      const firstName = nameParts[0] || updatedUser.name
      const lastName = nameParts.slice(1).join(' ') || ''
      
      // Preparar el payload con todos los campos requeridos
      // El backend requiere que todos los campos sean no-nulos y no-blancos
      // Usar valores actuales para campos que no se están actualizando
      const updatePayload = {
        userEmail: updatedUser.email || currentProfile.userEmail || '',
        userFirstName: firstName || currentProfile.userFirstName || '',
        userLastName: lastName || currentProfile.userLastName || '',
        userPhone: (currentProfile.userPhone && currentProfile.userPhone.trim() !== '') ? currentProfile.userPhone : 'N/A',
        userCountry: (currentProfile.userCountry && currentProfile.userCountry.trim() !== '') ? currentProfile.userCountry : 'N/A',
        userRole: currentProfile.userRole || 'User',
        userProfileImgUrl: (updatedUser.avatar && updatedUser.avatar !== `/placeholder.svg?height=40&width=40`) 
          ? updatedUser.avatar 
          : (currentProfile.userProfileImgUrl && currentProfile.userProfileImgUrl.trim() !== '') 
            ? currentProfile.userProfileImgUrl 
            : 'N/A'
      }
      
      // Validar que los campos requeridos no estén vacíos
      if (!updatePayload.userEmail || updatePayload.userEmail.trim() === '') {
        throw new Error('El email es requerido')
      }
      if (!updatePayload.userFirstName || updatePayload.userFirstName.trim() === '') {
        throw new Error('El nombre es requerido')
      }
      if (!updatePayload.userLastName || updatePayload.userLastName.trim() === '') {
        throw new Error('El apellido es requerido')
      }
      
      await profileService.updateUserProfile(updatedUser.id, updatePayload)
      
      // Refrescar el perfil desde Profile-Service
      const profile = await profileService.getUserProfile({ userId: updatedUser.id })
      const refreshedUser = mapProfileToUser(profile)
      setUser(refreshedUser)
    } catch (error) {
      console.error("Error updating user profile:", error)
      // Si falla, actualizar solo localmente
      setUser(updatedUser)
      throw error // Re-lanzar para que el componente pueda manejar el error
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading, isMounted, checkLimits, updateUsage, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
