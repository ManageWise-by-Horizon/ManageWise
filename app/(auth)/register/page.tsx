"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneInput } from "@/components/ui/phone-input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { parsePhoneNumber, getCountryCallingCode } from 'react-phone-number-input'
import type { E164Number } from 'react-phone-number-input'

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState<string>("")
  const [country, setCountry] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { register, user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect immediately using window.location
    if (!authLoading && user) {
      window.location.href = "/dashboard"
    }
  }, [user, authLoading])

  // Show loading only while checking initial auth status
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  // Don't render register form if user is already logged in
  if (user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Extraer país del número de teléfono si está disponible
      let detectedCountry = country
      if (phone && !detectedCountry) {
        try {
          const phoneNumber = parsePhoneNumber(phone)
          if (phoneNumber) {
            detectedCountry = phoneNumber.country || ""
          }
        } catch (error) {
          console.log("No se pudo parsear el número de teléfono")
        }
      }

      await register(email, password, firstName, lastName, phone, detectedCountry)
      // No need to handle navigation here - register() now handles it with window.location
      // Just show success message briefly
      toast({
        title: "¡Cuenta creada!",
        description: "Redirigiendo...",
        className: "bg-success text-success-foreground",
      })
    } catch (error) {
      toast({
        title: "Error al registrar",
        description: error instanceof Error ? error.message : "No se pudo crear la cuenta",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Mostrar loader en pantalla completa mientras se está procesando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Creando tu cuenta...</p>
          <p className="text-sm text-muted-foreground/60 mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <h1 className="text-3xl font-bold text-foreground">Manage Wize</h1>
          <p className="text-muted-foreground mt-2">Crea tu cuenta</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Registro</CardTitle>
            <CardDescription>Completa el formulario para crear tu cuenta</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <PhoneInput
                  id="phone"
                  placeholder="Ingresa tu número de teléfono"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value || "")
                    // Detectar país automáticamente del número
                    if (value) {
                      try {
                        const phoneNumber = parsePhoneNumber(value)
                        if (phoneNumber?.country) {
                          setCountry(phoneNumber.country)
                        }
                      } catch (error) {
                        // No hacer nada si no se puede parsear
                      }
                    }
                  }}
                  defaultCountry="PE"
                  disabled={isLoading}
                />
                {country && (
                  <p className="text-xs text-muted-foreground">
                    País detectado: {country}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
