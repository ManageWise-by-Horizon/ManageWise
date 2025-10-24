"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

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
      // Mock API call to JSON Server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?email=${email}`)
      const users = await response.json()

      if (users.length === 0) {
        throw new Error("Usuario no encontrado")
      }

      const foundUser = users[0]

      if (foundUser.password !== password) {
        throw new Error("Contraseña incorrecta")
      }

      // Create mock JWT token
      const token = btoa(JSON.stringify({ userId: foundUser.id, exp: Date.now() + 86400000 }))

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = foundUser

      if (typeof window !== 'undefined') {
        localStorage.setItem("auth_token", token)
        localStorage.setItem("user", JSON.stringify(userWithoutPassword))
      }

      setUser(userWithoutPassword)
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Login error:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      // Check if user already exists
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?email=${email}`)
      const existingUsers = await checkResponse.json()

      if (existingUsers.length > 0) {
        throw new Error("El correo ya está registrado")
      }

      // Create new user
      const newUser = {
        email,
        password,
        name,
        role,
        avatar: `/placeholder.svg?height=40&width=40&query=${name}`,
        subscription: {
          plan: "free" as Plan,
          tokensUsed: 0,
          tokensLimit: 100,
          userStoriesUsed: 0,
          userStoriesLimit: 10,
        },
        createdAt: new Date().toISOString(),
        resume: {
          skills: [],
          experience: "0 years",
          certifications: [],
        },
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      const createdUser = await response.json()

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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
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
