"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, CreditCard, Shield, Crown, Zap, TrendingUp, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import { uploadToImgBB } from "@/lib/imgbb"

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedUser = {
        ...user!,
        name: formData.name,
        email: formData.email,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      updateUser(updatedUser)

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email }),
      })

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida (JPG, PNG o GIF).",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB.",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)

    try {
      // Upload to ImgBB
      const imageUrl = await uploadToImgBB(file)

      // Update user profile
      const updatedUser = {
        ...user!,
        avatar: imageUrl,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      updateUser(updatedUser)

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: imageUrl }),
      })

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada exitosamente.",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      })

      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const isPremium = user.subscription.plan === "premium"
  const tokensPercentage = isPremium ? 0 : (user.subscription.tokensUsed / user.subscription.tokensLimit) * 100
  const storiesPercentage = isPremium
    ? 0
    : (user.subscription.userStoriesUsed / user.subscription.userStoriesLimit) * 100

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Configuración</h1>
        <p className="text-muted-foreground">Administra tu cuenta, suscripción y preferencias</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="w-4 h-4 mr-2" />
            Suscripción
          </TabsTrigger>
          <TabsTrigger value="usage">
            <TrendingUp className="w-4 h-4 mr-2" />
            Uso
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu información de perfil y foto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Cambiar foto
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG o GIF. Máximo 2MB.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Input id="role" value={user.role} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    El rol no puede ser modificado. Contacta al administrador.
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Actual</CardTitle>
              <CardDescription>Administra tu suscripción y facturación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  {isPremium ? (
                    <Crown className="w-10 h-10 text-primary" />
                  ) : (
                    <Zap className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">Plan {isPremium ? "Premium" : "Gratuito"}</h3>
                      <Badge variant={isPremium ? "default" : "secondary"}>{isPremium ? "Activo" : "Básico"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPremium
                        ? `$12/mes • Renovación: ${new Date(user.subscription.endDate!).toLocaleDateString("es-ES")}`
                        : "Sin costo • Límites aplicados"}
                    </p>
                  </div>
                </div>
                <Link href="/pricing">
                  <Button variant={isPremium ? "outline" : "default"}>
                    {isPremium ? "Administrar plan" : "Actualizar a Premium"}
                  </Button>
                </Link>
              </div>

              {isPremium && (
                <div className="space-y-4">
                  <h4 className="font-medium">Beneficios Premium</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Tokens IA ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      User stories ilimitadas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Dashboards predictivos con ML
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Soporte prioritario 24/7
                    </li>
                  </ul>
                </div>
              )}

              {!isPremium && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="font-medium mb-2 text-primary">Desbloquea todo el potencial de Manage Wize</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Actualiza a Premium y obtén acceso ilimitado a todas las funciones de IA, dashboards predictivos y
                    soporte prioritario.
                  </p>
                  <Link href="/pricing">
                    <Button size="sm">Ver planes</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos</CardTitle>
              <CardDescription>Monitorea tu consumo de tokens IA y user stories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Tokens IA</Label>
                    <span className="text-sm text-muted-foreground">
                      {isPremium ? (
                        <Badge variant="outline" className="text-xs">
                          Ilimitado
                        </Badge>
                      ) : (
                        `${user.subscription.tokensUsed} / ${user.subscription.tokensLimit}`
                      )}
                    </span>
                  </div>
                  {!isPremium && (
                    <>
                      <Progress value={tokensPercentage} className="h-2" />
                      {tokensPercentage >= 80 && (
                        <p className="text-xs text-amber-500 mt-2">
                          Estás cerca del límite. Considera actualizar a Premium.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>User Stories</Label>
                    <span className="text-sm text-muted-foreground">
                      {isPremium ? (
                        <Badge variant="outline" className="text-xs">
                          Ilimitado
                        </Badge>
                      ) : (
                        `${user.subscription.userStoriesUsed} / ${user.subscription.userStoriesLimit}`
                      )}
                    </span>
                  </div>
                  {!isPremium && (
                    <>
                      <Progress value={storiesPercentage} className="h-2" />
                      {storiesPercentage >= 80 && (
                        <p className="text-xs text-amber-500 mt-2">
                          Estás cerca del límite. Considera actualizar a Premium.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-4">Historial de Uso (últimos 7 días)</h4>
                <div className="space-y-3">
                  {[
                    { date: "Hoy", tokens: 15, stories: 2 },
                    { date: "Ayer", tokens: 23, stories: 3 },
                    { date: "Hace 2 días", tokens: 18, stories: 1 },
                    { date: "Hace 3 días", tokens: 12, stories: 2 },
                    { date: "Hace 4 días", tokens: 20, stories: 1 },
                  ].map((day, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{day.date}</span>
                      <div className="flex items-center gap-4">
                        <span>{day.tokens} tokens</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{day.stories} stories</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zona de Peligro</CardTitle>
              <CardDescription>Acciones irreversibles en tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-destructive">Cerrar sesión en todos los dispositivos</h4>
                  <p className="text-sm text-muted-foreground">Cierra todas las sesiones activas excepto esta</p>
                </div>
                <Button variant="destructive" size="sm">
                  Cerrar sesiones
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-destructive">Eliminar cuenta</h4>
                  <p className="text-sm text-muted-foreground">Elimina permanentemente tu cuenta y todos tus datos</p>
                </div>
                <Button variant="destructive" size="sm">
                  Eliminar cuenta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
