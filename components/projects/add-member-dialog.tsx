"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, Mail, AlertCircle, CheckCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentMembers: string[]
  onMemberAdded: () => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  projectId,
  currentMembers,
  onMemberAdded,
}: AddMemberDialogProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("existing")
  
  // Estados para invitación por email
  const [inviteEmail, setInviteEmail] = useState("")
  const [emailError, setEmailError] = useState("")

  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
      // Reset states cuando se abre el diálogo
      setInviteEmail("")
      setEmailError("")
      setSelectedUsers([])
    }
  }, [open])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const checkUserAlreadyMember = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const allUsers = await response.json()
      const existingUser = allUsers.find((u: User) => u.email.toLowerCase() === email.toLowerCase())
      
      if (existingUser && currentMembers.includes(existingUser.id)) {
        return true
      }
      return false
    } catch (error) {
      console.error("Error verificando membresía:", error)
      return false
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const data = await response.json()
      // Filter out users already in the project
      const availableUsers = data.filter((u: User) => !currentMembers.includes(u.id))
      setUsers(availableUsers)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    }
  }

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return

    setIsLoading(true)

    try {
      // Fetch current project
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
      const project = await projectRes.json()

      // Update project with new members
      const updatedMembers = [...project.members, ...selectedUsers]

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: updatedMembers }),
      })

      toast({
        title: "Miembros agregados",
        description: `${selectedUsers.length} miembro(s) agregado(s) al proyecto`,
      })

      setSelectedUsers([])
      onOpenChange(false)
      onMemberAdded()
    } catch (error) {
      console.error("[v0] Error adding members:", error)
      toast({
        title: "Error",
        description: "No se pudieron agregar los miembros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteByEmail = async () => {
    // Limpiar errores previos
    setEmailError("")

    // Validar formato de email
    if (!validateEmail(inviteEmail)) {
      setEmailError("El formato del correo electrónico no es válido")
      return
    }

    // Verificar si ya es miembro
    const isAlreadyMember = await checkUserAlreadyMember(inviteEmail)
    if (isAlreadyMember) {
      setEmailError("Este usuario ya es miembro del proyecto")
      return
    }

    setIsLoading(true)

    try {
      // Verificar si el usuario existe en el sistema
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const allUsers = await usersRes.json()
      const existingUser = allUsers.find((u: User) => u.email.toLowerCase() === inviteEmail.toLowerCase())

      if (existingUser) {
        // Usuario existe - agregar directamente al proyecto
        const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
        const project = await projectRes.json()

        const updatedMembers = [...project.members, existingUser.id]

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: updatedMembers }),
        })

        toast({
          title: "Miembro agregado exitosamente",
          description: `${existingUser.name} ha sido agregado al proyecto`,
        })
      } else {
        // Usuario no existe - simular envío de invitación
        // En un sistema real, aquí se enviaría un email de invitación
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${inviteEmail}`,
        })

        // Simular registro de invitación pendiente
        console.log(`Invitación enviada a ${inviteEmail} para proyecto ${projectId}`)
      }

      setInviteEmail("")
      onOpenChange(false)
      onMemberAdded()
    } catch (error) {
      console.error("Error enviando invitación:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      scrum_master: { label: "Scrum Master", color: "bg-chart-1" },
      product_owner: { label: "Product Owner", color: "bg-chart-2" },
      developer: { label: "Developer", color: "bg-chart-3" },
    }
    return roleMap[role] || { label: role, color: "bg-muted" }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar Miembros al Proyecto
          </DialogTitle>
          <DialogDescription>
            Agrega usuarios existentes o invita nuevos miembros por correo electrónico
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Usuarios Existentes</TabsTrigger>
            <TabsTrigger value="invite">Invitar por Email</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3">
            <div className="max-h-96 overflow-y-auto space-y-3">
              {users.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay usuarios disponibles para agregar al proyecto
                  </AlertDescription>
                </Alert>
              ) : (
                users.map((user) => {
                  const roleBadge = getRoleBadge(user.role)
                  const isSelected = selectedUsers.includes(user.id)

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                            }
                          }}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-chart-1 text-white">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <Badge className={`mt-1 text-xs ${roleBadge.color}`}>{roleBadge.label}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    if (emailError) setEmailError("")
                  }}
                  className={`pl-9 ${emailError ? "border-destructive" : ""}`}
                />
              </div>
              {emailError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Si el usuario ya tiene cuenta, será agregado automáticamente. 
                Si no, recibirá una invitación por correo electrónico.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          
          {activeTab === "existing" ? (
            <Button onClick={handleAddMembers} disabled={isLoading || selectedUsers.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleInviteByEmail} disabled={isLoading || !inviteEmail.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Invitación
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
