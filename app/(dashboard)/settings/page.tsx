"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, CreditCard, Shield, Crown, Zap, TrendingUp, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import { uploadToImgBB } from "@/lib/imgbb"
import { createApiUrl } from "@/lib/api-config"
import { profileService } from "@/lib/domain/profile/services/profile.service"
import type { UserProfile } from "@/lib/domain/profile/types/profile.types"

// Lista de países comunes
const COUNTRIES = [
  { value: "España", label: "España" },
  { value: "México", label: "México" },
  { value: "Argentina", label: "Argentina" },
  { value: "Colombia", label: "Colombia" },
  { value: "Chile", label: "Chile" },
  { value: "Perú", label: "Perú" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Guatemala", label: "Guatemala" },
  { value: "Cuba", label: "Cuba" },
  { value: "Bolivia", label: "Bolivia" },
  { value: "República Dominicana", label: "República Dominicana" },
  { value: "Honduras", label: "Honduras" },
  { value: "Paraguay", label: "Paraguay" },
  { value: "Nicaragua", label: "Nicaragua" },
  { value: "El Salvador", label: "El Salvador" },
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "Panamá", label: "Panamá" },
  { value: "Uruguay", label: "Uruguay" },
  { value: "Estados Unidos", label: "Estados Unidos" },
  { value: "Canadá", label: "Canadá" },
  { value: "Brasil", label: "Brasil" },
  { value: "Reino Unido", label: "Reino Unido" },
  { value: "Francia", label: "Francia" },
  { value: "Alemania", label: "Alemania" },
  { value: "Italia", label: "Italia" },
  { value: "Portugal", label: "Portugal" },
  { value: "Otro", label: "Otro" },
]

// Códigos de país para teléfonos
const PHONE_COUNTRY_CODES = [
  { value: "+34", label: "+34 (España)" },
  { value: "+52", label: "+52 (México)" },
  { value: "+54", label: "+54 (Argentina)" },
  { value: "+57", label: "+57 (Colombia)" },
  { value: "+56", label: "+56 (Chile)" },
  { value: "+51", label: "+51 (Perú)" },
  { value: "+58", label: "+58 (Venezuela)" },
  { value: "+593", label: "+593 (Ecuador)" },
  { value: "+502", label: "+502 (Guatemala)" },
  { value: "+53", label: "+53 (Cuba)" },
  { value: "+591", label: "+591 (Bolivia)" },
  { value: "+1", label: "+1 (EE.UU./Canadá)" },
  { value: "+55", label: "+55 (Brasil)" },
  { value: "+44", label: "+44 (Reino Unido)" },
  { value: "+33", label: "+33 (Francia)" },
  { value: "+49", label: "+49 (Alemania)" },
  { value: "+39", label: "+39 (Italia)" },
  { value: "+351", label: "+351 (Portugal)" },
]

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Obtener el tab activo desde la URL o usar "profile" por defecto
  const activeTab = searchParams.get("tab") || "profile"

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    phoneCountryCode: "+34", // Código por defecto
    country: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Cargar perfil completo del usuario
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          setLoadingProfile(true)
          const userProfile = await profileService.getUserProfile({ userId: user.id })
          setProfile(userProfile)
          // Extraer código de país del teléfono si existe
          const phoneValue = userProfile.userPhone || ""
          const phoneMatch = phoneValue.match(/^(\+\d{1,3})\s*(.+)$/)
          const phoneCountryCode = phoneMatch ? phoneMatch[1] : "+34"
          const phoneNumber = phoneMatch ? phoneMatch[2] : phoneValue

          setFormData({
            firstName: userProfile.userFirstName || "",
            lastName: userProfile.userLastName || "",
            email: userProfile.userEmail || user?.email || "",
            phone: phoneNumber,
            phoneCountryCode: phoneCountryCode,
            country: userProfile.userCountry || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        } catch (error) {
          console.error("Error loading profile:", error)
          // Si falla, usar datos del user del contexto
          const nameParts = user.name?.split(" ") || []
          setFormData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: user.email || "",
            phone: "",
            country: "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
        } finally {
          setLoadingProfile(false)
        }
      }
    }
    loadProfile()
  }, [user?.id, user?.email, user?.name])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user?.id) {
        throw new Error("Usuario no encontrado")
      }

      if (!profile) {
        throw new Error("Perfil no cargado. Por favor, recarga la página.")
      }

      // El backend requiere TODOS los campos no-nulos y no-blancos
      // Validar y preparar todos los campos requeridos
      const firstName = (formData.firstName || "").trim() || (profile.userFirstName || "").trim() || ""
      const lastName = (formData.lastName || "").trim() || (profile.userLastName || "").trim() || ""
      
      if (!firstName) {
        toast({
          title: "Error de validación",
          description: "El nombre es requerido.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Preparar todos los campos con valores válidos (no vacíos)
      // El backend requiere que todos los campos sean no-nulos y no-blancos
      // Combinar código de país con número de teléfono
      const phoneNumber = (formData.phone || "").trim()
      const fullPhone = phoneNumber ? `${formData.phoneCountryCode || "+34"} ${phoneNumber}` : (profile.userPhone || "").trim()
      const currentPhone = fullPhone || "N/A"
      const currentCountry = (formData.country || "").trim() || (profile.userCountry || "").trim()
      const currentProfileImg = profile.userProfileImgUrl && 
                                profile.userProfileImgUrl.trim() !== "" && 
                                profile.userProfileImgUrl !== "null" 
                                ? profile.userProfileImgUrl.trim() 
                                : null

      const updatePayload = {
        userEmail: (profile.userEmail || user.email || "").trim(),
        userFirstName: firstName,
        userLastName: lastName || "N/A", // Si está vacío, usar "N/A"
        userPhone: currentPhone || "N/A",
        userCountry: currentCountry || "N/A",
        userRole: (profile.userRole || "User").trim(),
        userProfileImgUrl: currentProfileImg || "N/A",
      }

      // Validación final de campos requeridos
      if (!updatePayload.userEmail || updatePayload.userEmail.trim() === "") {
        toast({
          title: "Error",
          description: "El correo electrónico es requerido.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Asegurar que todos los campos tengan valores válidos (no vacíos)
      const finalPayload = {
        userEmail: updatePayload.userEmail,
        userFirstName: updatePayload.userFirstName,
        userLastName: updatePayload.userLastName || "N/A",
        userPhone: updatePayload.userPhone || "N/A",
        userCountry: updatePayload.userCountry || "N/A",
        userRole: updatePayload.userRole || "User",
        userProfileImgUrl: updatePayload.userProfileImgUrl || "N/A",
      }

      console.log("[Settings] Updating profile with payload:", finalPayload)

      const updatedProfile = await profileService.updateUserProfile(user.id, finalPayload)

      // Actualizar el estado local del perfil
      setProfile(updatedProfile)

      // Actualizar el usuario en el contexto con el nombre completo
      const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.firstName
      const updatedUser = {
        ...user,
        name: fullName,
      }
      await updateUser(updatedUser)

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta de nuevo.",
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
      // Upload to ImgBB (o usar data URL si no hay API key)
      const imageUrl = await uploadToImgBB(file)

      // Update user profile
      const updatedUser = {
        ...user!,
        avatar: imageUrl,
      }

      localStorage.setItem("user", JSON.stringify(updatedUser))
      updateUser(updatedUser)

      // TODO: Actualizar en Profile-Service cuando esté disponible
      // await fetch(createApiUrl(`/api/v1/profiles/${user!.id}`), {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ avatar: imageUrl }),
      // })

      toast({
        title: "Foto actualizada",
        description: imageUrl.startsWith('data:') 
          ? "Tu foto de perfil ha sido actualizada (modo local). Para subir a la nube, configura NEXT_PUBLIC_IMGBB_API_KEY en .env.local"
          : "Tu foto de perfil ha sido actualizada exitosamente.",
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

      <Tabs value={activeTab} onValueChange={(value) => router.push(`/settings?tab=${value}`)} className="space-y-6">
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

              {loadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Cargando perfil...</span>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.phoneCountryCode}
                          onValueChange={(value) => setFormData({ ...formData, phoneCountryCode: value })}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Código" />
                          </SelectTrigger>
                          <SelectContent>
                            {PHONE_COUNTRY_CODES.map((code) => (
                              <SelectItem key={code.value} value={code.value}>
                                {code.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="123456789"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar país" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar cambios"
                    )}
                  </Button>
                </form>
              )}
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
