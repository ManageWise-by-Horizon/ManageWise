"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createApiUrl } from "@/lib/api-config"

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
  firstName: string
  lastName: string
  phone: string
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
  register: (email: string, password: string, firstName: string, lastName: string, phone: string, country?: string) => Promise<void>
  isLoading: boolean
  isMounted: boolean
  checkLimits: (type: "tokens" | "userStories", amount?: number) => boolean
  updateUsage: (type: "tokens" | "userStories", amount: number) => void
  updateUser: (user: User) => void
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

  useEffect(() => {
    if (!isMounted) return
    
    // Verificar si hay un usuario autenticado en localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user")
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          
          // Migrar estructura antigua si es necesaria
          if (parsedUser.plan || parsedUser.tokensUsed !== undefined) {
            const migratedUser: User = {
              ...parsedUser,
              subscription: {
                plan: parsedUser.plan || "free",
                tokensUsed: parsedUser.tokensUsed || 0,
                tokensLimit: parsedUser.tokensLimit || 100,
                userStoriesUsed: parsedUser.userStoriesUsed || 0,
                userStoriesLimit: parsedUser.userStoriesLimit || 10,
              },
            }
            // Remove old fields
            delete (migratedUser as any).plan
            delete (migratedUser as any).tokensUsed
            delete (migratedUser as any).tokensLimit
            delete (migratedUser as any).userStoriesUsed
            delete (migratedUser as any).userStoriesLimit
            
            // Save migrated structure
            localStorage.setItem("user", JSON.stringify(migratedUser))
            setUser(migratedUser)
          } else {
            setUser(parsedUser)
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
          // Clear corrupted data
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
        }
      }
    }

    setIsLoading(false)
  }, [isMounted])

  const login = async (email: string, password: string) => {
    try {
      // Call Auth-Service to sign in
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8080'}/api/v1/authentication/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      })

      if (!authResponse.ok) {
        const error = await authResponse.text()
        console.error("[v0] Auth error response:", error)
        throw new Error(error || "Credenciales inválidas")
      }

      const authData = await authResponse.json()
      console.log("[v0] Auth response data:", authData)
      const { userId, userToken, userEmail } = authData

      // Get user profile from Profile-Service
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || 'http://localhost:8081'}/api/v1/profiles/${userId}`, {
        headers: { 
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json"
        },
      })

      if (!profileResponse.ok) {
        console.error("[v0] Profile fetch error:", await profileResponse.text())
        throw new Error("Error al obtener perfil de usuario")
      }

      const profileData = await profileResponse.json()
      console.log("[v0] Profile data:", profileData)

      // Build complete user object
      const userObject: User = {
        id: profileData.userId,
        email: profileData.userEmail,
        firstName: profileData.userFirstName,
        lastName: profileData.userLastName,
        phone: profileData.userPhone,
        role: "developer", // TODO: Get from Auth or Profile
        avatar: profileData.userProfileImgUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.userEmail}`,
        subscription: {
          plan: "free",
          tokensUsed: 0,
          tokensLimit: 100,
          userStoriesUsed: 0,
          userStoriesLimit: 10,
        },
        resume: {
          skills: [],
          experience: "0 years",
          certifications: [],
        },
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem("auth_token", userToken)
        localStorage.setItem("user", JSON.stringify(userObject))
      }

      setUser(userObject)
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, phone: string, country?: string) => {
    try {
      // Call Auth-Service to sign up
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8080'}/api/v1/authentication/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userFirstName: firstName,
          userLastName: lastName,
          userEmail: email,
          userPhone: phone,
          userCountry: country || "Unknown",
          userPassword: password,
        }),
      })

      if (!authResponse.ok) {
        const error = await authResponse.text()
        throw new Error(error || "Error al crear la cuenta")
      }

      const authData = await authResponse.json()
      const userId = authData.userId

      // Wait a bit for Profile-Service to create profile via ActiveMQ event
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get user profile from Profile-Service
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || 'http://localhost:8081'}/api/v1/profiles/${userId}`, {
        headers: { "Content-Type": "application/json" },
      })

      let profileData
      if (profileResponse.ok) {
        profileData = await profileResponse.json()
      } else {
        // If profile doesn't exist yet, use data from auth response
        profileData = {
          userId: userId,
          userEmail: email,
          userFirstName: firstName,
          userLastName: lastName,
          userPhone: phone,
          userProfileImgUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
        }
      }

      // Auto login - call sign-in to get JWT
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8080'}/api/v1/authentication/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      })

      if (!loginResponse.ok) {
        throw new Error("Error al iniciar sesión")
      }

      const loginData = await loginResponse.json()
      const { token } = loginData

      // Build complete user object
      const userObject: User = {
        id: profileData.userId,
        email: profileData.userEmail,
        firstName: profileData.userFirstName,
        lastName: profileData.userLastName,
        phone: profileData.userPhone,
        role: "developer", // Rol por defecto temporal, se asigna por proyecto
        avatar: profileData.userProfileImgUrl,
        subscription: {
          plan: "free",
          tokensUsed: 0,
          tokensLimit: 100,
          userStoriesUsed: 0,
          userStoriesLimit: 10,
        },
        resume: {
          skills: [],
          experience: "0 years",
          certifications: [],
        },
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem("auth_token", token)
        localStorage.setItem("user", JSON.stringify(userObject))
      }

      setUser(userObject)
      
      // Redirect to dashboard
      if (typeof window !== 'undefined') {
        window.location.href = "/dashboard"
      }
    } catch (error) {
      console.error("[v0] Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
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

    // Update in JSON Server
    await fetch(createApiUrl(`/users/${user.id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: updatedUser.subscription,
      }),
    })

    setUser(updatedUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem("user", JSON.stringify(updatedUser))
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
