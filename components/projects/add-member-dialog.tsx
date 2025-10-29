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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, Mail, AlertTriangle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { createApiUrl } from "@/lib/api-config"

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
  currentUserId: string
  onMemberAdded: () => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  projectId,
  currentMembers,
  currentUserId,
  onMemberAdded,
}: AddMemberDialogProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [emailInvites, setEmailInvites] = useState("")
  const [activeTab, setActiveTab] = useState("existing")
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
      checkAdminPermissions()
    }
  }, [open])

  const checkAdminPermissions = async () => {
    try {
      // Verificar si el usuario actual es administrador del proyecto
      const projectRes = await fetch(createApiUrl(`/projects/${projectId}`))
      const project = await projectRes.json()
      
      // Verificar si es el creador del proyecto
      const isCreator = project.createdBy === currentUserId
      
      // Verificar permisos específicos en la tabla de permisos
      const permissionsRes = await fetch(createApiUrl(`/projectPermissions?projectId=${projectId}&userId=${currentUserId}`))
      const permissions = await permissionsRes.json()
      
      const hasManagePermission = permissions.some((perm: any) => 
        perm.userId === currentUserId && perm.manage_members === true
      )
      
      setIsAdmin(isCreator || hasManagePermission)
    } catch (error) {
      console.error("[v0] Error checking admin permissions:", error)
      setIsAdmin(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(createApiUrl('/users'))
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

    // Verificar permisos de administrador
    if (!isAdmin) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores del proyecto pueden invitar nuevos miembros",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Fetch current project
      const projectRes = await fetch(createApiUrl(`/projects/${projectId}`))
      const project = await projectRes.json()

      // Obtener información de los usuarios seleccionados
      const usersRes = await fetch(createApiUrl('/users'))
      const allUsers = await usersRes.json()

      // Obtener información del usuario actual (quien invita)
      const currentUserData = allUsers.find((u: User) => u.id === currentUserId)

      // Crear invitaciones para cada usuario (NO agregar directamente al proyecto)
      const invitationsPromises = selectedUsers.map(async (userId) => {
        const invitedUser = allUsers.find((u: User) => u.id === userId)
        if (!invitedUser) return

        // Verificar si ya tiene una invitación pendiente
        const existingInvitationsRes = await fetch(
          createApiUrl(`/projectInvitations?projectId=${projectId}&email=${invitedUser.email}&status=pending`)
        )
        const existingInvitations = await existingInvitationsRes.json()

        if (existingInvitations.length > 0) {
          return // Ya tiene invitación pendiente
        }

        // Preparar el mensaje personalizado o por defecto
        const invitationMessage = message || `Te invitamos a formar parte del proyecto "${project.name}"`
        
        // Crear invitación
        const invitation = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          email: invitedUser.email,
          invitedBy: currentUserId,
          message: invitationMessage,
          status: "pending",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 días
        }

        await fetch(createApiUrl('/projectInvitations'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invitation),
        })

        // Crear notificación para el usuario invitado
        const notification = {
          id: `notif_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: invitedUser.id,
          projectId,
          type: "project_invitation",
          title: "Invitación a proyecto",
          message: invitationMessage, // Usar el mismo mensaje de la invitación
          data: {
            projectId,
            projectName: project.name,
            invitationId: invitation.id,
            invitedBy: currentUserId,
            invitedByName: currentUserData?.name || 'Usuario desconocido',
            email: invitedUser.email,
            changeType: "invited"
          },
          read: false,
          createdAt: new Date().toISOString(),
          deliveryStatus: "pending"
        }

        await fetch(createApiUrl('/notifications'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notification),
        })
      })

      await Promise.all(invitationsPromises)

      toast({
        title: "Invitaciones enviadas",
        description: `Se enviaron ${selectedUsers.length} invitación(es). Los usuarios deben aceptar para unirse al proyecto.`,
      })

      setSelectedUsers([])
      setMessage("")
      setEmailInvites("")
      onOpenChange(false)
      onMemberAdded()
    } catch (error) {
      console.error("[v0] Error sending invitations:", error)
      toast({
        title: "Error",
        description: "No se pudieron enviar las invitaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailInvites = async () => {
    // Verificar permisos de administrador
    if (!isAdmin) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores del proyecto pueden invitar nuevos miembros",
        variant: "destructive",
      })
      return
    }

    const emails = emailInvites
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa al menos un email",
        variant: "destructive",
      })
      return
    }

    // Escenario 3: Validación de formato de email
    const invalidEmails = emails.filter(email => !validateEmail(email))
    if (invalidEmails.length > 0) {
      toast({
        title: "Formato de email inválido",
        description: `Los siguientes emails no son válidos: ${invalidEmails.join(', ')}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Escenario 2: Verificar si los emails ya pertenecen a usuarios del proyecto
      const allUsersRes = await fetch(createApiUrl('/users'))
      const allUsers = await allUsersRes.json()
      
      // Obtener usuarios actuales del proyecto
      const projectRes = await fetch(createApiUrl(`/projects/${projectId}`))
      const project = await projectRes.json()
      
      const projectMemberEmails = allUsers
        .filter((user: User) => project.members.includes(user.id))
        .map((user: User) => user.email)

      const duplicateEmails = emails.filter(email => 
        projectMemberEmails.includes(email)
      )

      if (duplicateEmails.length > 0) {
        toast({
          title: "Usuario ya es miembro del proyecto",
          description: `Los siguientes usuarios ya pertenecen al proyecto: ${duplicateEmails.join(', ')}`,
          variant: "destructive",
        })
        return
      }

      // Escenario 1: Registrar invitaciones en la base de datos
      const currentUser = await fetch(createApiUrl(`/users/${currentUserId}`))
      const user = await currentUser.json()

      const invitations = emails.map(email => ({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        email,
        invitedBy: user.id,
        message: message || "Te invitamos a formar parte de nuestro equipo en este proyecto.",
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 días
      }))

      // Registrar cada invitación
      for (const invitation of invitations) {
        await fetch(createApiUrl('/projectInvitations'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invitation),
        })

        // Escenario 1: Crear notificación para el usuario invitado
        const invitationNotification = {
          id: `notif_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: null, // Se enviará por email ya que puede que no tenga cuenta
          projectId,
          type: "email_invitation",
          title: "Invitación a proyecto",
          message: `Has sido invitado a unirte al proyecto "${project.name}"`,
          data: {
            projectId,
            projectName: project.name,
            invitationId: invitation.id,
            invitedBy: invitation.invitedBy,
            email: invitation.email,
            changeType: "invited"
          },
          read: false,
          createdAt: new Date().toISOString(),
          deliveryStatus: "pending"
        }

        await fetch(createApiUrl('/notifications'), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invitationNotification),
        })
      }

      // Simular envío de emails
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: "Invitaciones enviadas por email",
        description: `Se enviaron invitaciones a ${emails.length} email(s)`,
      })

      setSelectedUsers([])
      setMessage("")
      setEmailInvites("")
      onOpenChange(false)
      onMemberAdded()
    } catch (error) {
      console.error("[v0] Error sending email invites:", error)
      toast({
        title: "Error",
        description: "No se pudieron enviar las invitaciones por email",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invitar Miembros al Proyecto
          </DialogTitle>
          <DialogDescription>
            Agrega usuarios existentes o invita nuevos miembros por correo electrónico
          </DialogDescription>
        </DialogHeader>

        {!isAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Permisos requeridos</span>
            </div>
            <p className="mt-1 text-sm text-amber-700">
              Solo los administradores del proyecto pueden invitar nuevos miembros. 
              Contacta al administrador si necesitas agregar alguien al proyecto.
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" disabled={!isAdmin}>
              Usuarios Existentes
            </TabsTrigger>
            <TabsTrigger value="email" disabled={!isAdmin}>
              Invitar por Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Mensaje de invitación <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Ej: ¡Hola! Te invitamos a formar parte de nuestro equipo en este emocionante proyecto..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay usuarios disponibles para invitar
                </p>
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

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddMembers} 
                disabled={isLoading || selectedUsers.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invitando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="email-message" className="text-sm font-medium">
                Mensaje de invitación <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="email-message"
                placeholder="Ej: ¡Hola! Te invitamos a formar parte de nuestro equipo en este emocionante proyecto..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="emails" className="text-sm font-medium">
                Direcciones de correo electrónico
              </Label>
              <Textarea
                id="emails"
                placeholder="usuario1@ejemplo.com, usuario2@ejemplo.com, usuario3@ejemplo.com"
                value={emailInvites}
                onChange={(e) => setEmailInvites(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Separa múltiples emails con comas. Se enviará una invitación a cada dirección.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleEmailInvites} 
                disabled={isLoading || !emailInvites.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando invitaciones...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Invitaciones por Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
