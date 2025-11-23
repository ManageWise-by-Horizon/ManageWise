"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!authLoading && user) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
        className: "bg-success text-success-foreground",
      })
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg shadow-primary/20 mb-2 transition-transform hover:scale-105">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 3H4C3.44772 3 3 3.44772 3 4V9C3 9.55228 3.44772 10 4 10H9C9.55228 10 10 9.55228 10 9V4C10 3.44772 9.55228 3 9 3Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 3H15C14.4477 3 14 3.44772 14 4V9C14 9.55228 14.4477 10 15 10H20C20.5523 10 21 9.55228 21 9V4C21 3.44772 20.5523 3 20 3Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M9 14H4C3.44772 14 3 14.4477 3 15V20C3 20.5523 3.44772 21 4 21H9C9.55228 21 10 20.5523 10 20V15C10 14.4477 9.55228 14 9 14Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 14H15C14.4477 14 14 14.4477 14 15V20C14 20.5523 14.4477 21 15 21H20C20.5523 21 21 20.5523 21 20V15C21 14.4477 20.5523 14 20 14Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M7 7L17 17" stroke="#08f1e5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight pb-1">
              Manage Wize
            </h1>
            <p className="text-muted-foreground mt-2 text-base">Gestor de proyectos con IA</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-base">Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20 border-border/50 hover:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20 border-border/50 hover:border-primary/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-200 font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-primary font-semibold hover:underline transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
