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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, Users, Settings, Lock, UserX } from "lucide-react"
import { createApiUrl } from "@/lib/api-config"
import { profileService } from "@/lib/domain/profile/services/profile.service"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

type ProjectRole = 'scrum_master' | 'product_owner' | 'developer' | 'tester' | 'designer' | 'stakeholder'

interface UserPermissions {
  userId: string
  role: ProjectRole
  read: boolean
  write: boolean
  manage_project: boolean
  manage_members: boolean
  manage_permissions: boolean
}

interface ManagePermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentUser: User
  isAdmin: boolean
  onPermissionsUpdated: () => void
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  projectId,
  currentUser,
  isAdmin,
  onPermissionsUpdated,
}: ManagePermissionsDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<UserPermissions[]>([])
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [userToRemove, setUserToRemove] = useState<{ id: string; name: string } | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchMembersAndPermissions()
    }
  }, [open, projectId])

  const fetchMembersAndPermissions = async () => {
    try {
      setIsLoading(true)
      
      // Cargar proyecto usando el servicio DDD
      const { projectService } = await import('@/lib/domain/projects/services/project.service')
      const project = await projectService.getProjectById(projectId)
      
      if (!project) {
        throw new Error('Proyecto no encontrado')
      }
      
      // Obtener perfiles de los miembros desde Profile-Service
      const memberIds = project.members && Array.isArray(project.members) ? project.members : []
      const memberProfiles = await Promise.all(
        memberIds.map(async (memberId: string) => {
          try {
            const profile = await profileService.getUserProfile({ userId: memberId })
            return {
              id: profile.userId,
              name: `${profile.userFirstName} ${profile.userLastName}`.trim() || profile.userEmail,
              email: profile.userEmail,
              role: profile.userRole || 'developer',
              avatar: profile.userProfileImgUrl || '/placeholder.svg'
            }
          } catch (error) {
            console.warn(`Could not fetch profile for user ${memberId}:`, error)
            return {
              id: memberId,
              name: memberId.split('@')[0] || memberId,
              email: memberId.includes('@') ? memberId : `${memberId}@example.com`,
              role: 'developer',
              avatar: '/placeholder.svg'
            }
          }
        })
      )
      
      const projectMembers: User[] = memberProfiles
      
      // Cargar permisos reales del proyecto usando el servicio DDD
      const { permissionService } = await import('@/lib/domain/projects/services/permission.service')
      let projectPermissions: UserPermissions[] = []
      
      try {
        const allPermissions = await permissionService.getPermissionsByProjectId(projectId)
        projectPermissions = (Array.isArray(allPermissions) ? allPermissions : []).map((perm: any) => ({
          userId: perm.userId,
          role: perm.role as ProjectRole,
          read: perm.read || false,
          write: perm.write || false,
          manage_project: perm.manageProject || false,
          manage_members: perm.manageMembers || false,
          manage_permissions: perm.managePermissions || false
        }))
      } catch (error) {
        console.warn('Error loading permissions:', error)
      }
      
      // Si no hay permisos, crear permisos por defecto
      if (projectPermissions.length === 0) {
        projectPermissions = projectMembers.map((member: User) => ({
          userId: member.id,
          role: 'developer' as ProjectRole,
          read: true,
          write: true,
          manage_project: false,
          manage_members: false,
          manage_permissions: false
        }))
      }

      setProjectMembers(projectMembers)
      setPermissions(projectPermissions)
      
      // Seleccionar el primer miembro por defecto si hay miembros
      if (projectMembers.length > 0 && !selectedMemberId) {
        setSelectedMemberId(projectMembers[0].id)
      }
    } catch (error) {
      console.error('Error fetching members and permissions:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updatePermission = (userId: string, permission: keyof Omit<UserPermissions, 'userId' | 'role'>, value: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, [permission]: value }
          : p
      )
    )
  }

  const updateRole = (userId: string, role: ProjectRole) => {
    setPermissions(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, role }
          : p
      )
    )
  }

  const setPermissionPreset = (userId: string, preset: 'admin' | 'manager' | 'member' | 'viewer') => {
    const presets = {
      admin: { read: true, write: true, manage_project: true, manage_members: true, manage_permissions: true },
      manager: { read: true, write: true, manage_project: true, manage_members: true, manage_permissions: false },
      member: { read: true, write: true, manage_project: false, manage_members: false, manage_permissions: false },
      viewer: { read: true, write: false, manage_project: false, manage_members: false, manage_permissions: false }
    }

    setPermissions(prev =>
      prev.map(p =>
        p.userId === userId
          ? { ...p, ...presets[preset] }
          : p
      )
    )
  }

  const getUserPermissions = (userId: string): UserPermissions | undefined => {
    return permissions.find(p => p.userId === userId)
  }

  const getPermissionLevel = (userPerms: UserPermissions) => {
    if (userPerms.manage_permissions) return { label: "Admin", color: "bg-red-100 text-red-800" }
    if (userPerms.manage_project || userPerms.manage_members) return { label: "Manager", color: "bg-blue-100 text-blue-800" }
    if (userPerms.write) return { label: "Miembro", color: "bg-green-100 text-green-800" }
    return { label: "Visualizador", color: "bg-gray-100 text-gray-800" }
  }

  const getRoleLabel = (role: ProjectRole) => {
    const roleLabels: Record<ProjectRole, string> = {
      scrum_master: 'Scrum Master',
      product_owner: 'Product Owner',
      developer: 'Developer',
      tester: 'Tester',
      designer: 'Designer',
      stakeholder: 'Stakeholder'
    }
    return roleLabels[role] || role
  }

  const handleRemoveMember = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminarte a ti mismo del proyecto",
        variant: "destructive",
      })
      return
    }

    // Abrir diálogo de confirmación
    setUserToRemove({ id: userId, name: userName })
    setRemoveDialogOpen(true)
  }

  const confirmRemoveMember = async () => {
    if (!userToRemove) return

    const { id: userId, name: userName } = userToRemove

    try {
      setIsLoading(true)
      setRemoveDialogOpen(false)

      // 1. Obtener el proyecto usando el servicio DDD
      const { projectService } = await import('@/lib/domain/projects/services/project.service')
      const project = await projectService.getProjectById(projectId)

      if (!project) {
        throw new Error('Proyecto no encontrado')
      }

      // 2. Remover usuario del proyecto usando el servicio DDD
      await projectService.removeMember(projectId, userId)

      // 3. Eliminar permisos del usuario usando el servicio DDD
      const { permissionService } = await import('@/lib/domain/projects/services/permission.service')
      const allPermissions = await permissionService.getPermissionsByProjectId(projectId)
      const userPerm = (Array.isArray(allPermissions) ? allPermissions : []).find(
        (p: any) => p.userId === userId
      )
      
      if (userPerm) {
        await permissionService.deletePermission(userPerm.id)
      }

      // 4. Crear notificación para el usuario eliminado usando el servicio DDD
      const { notificationService } = await import('@/lib/domain/notifications/services/notification.service')
      await notificationService.createNotification({
        userId: userId,
        projectId: projectId,
        type: "member_removed",
        title: "Has sido removido del proyecto",
        message: `Has sido eliminado del proyecto "${project.name}" por ${currentUser.name}`,
        data: {
          projectId: projectId,
          projectName: project.name,
          removedBy: currentUser.id,
          removedByName: currentUser.name,
          changeType: "removed"
        }
      })

      toast({
        title: "Miembro eliminado",
        description: `${userName} ha sido eliminado del proyecto`,
      })

      // Recargar la lista de miembros
      setUserToRemove(null)
      setSelectedMemberId(null) // Limpiar selección
      await fetchMembersAndPermissions()
      onPermissionsUpdated()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar al miembro del proyecto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Actualizar permisos de cada usuario usando el servicio DDD
      const { permissionService } = await import('@/lib/domain/projects/services/permission.service')
      
      const updatePromises = permissions.map(async (perm) => {
        try {
          // Buscar si ya existe un registro de permisos
          const allPermissions = await permissionService.getPermissionsByProjectId(projectId)
          const existingPerm = (Array.isArray(allPermissions) ? allPermissions : []).find(
            (p: any) => p.userId === perm.userId
          )
          
          if (existingPerm) {
            // Actualizar permisos existentes
            await permissionService.updatePermission(existingPerm.id, {
              role: perm.role,
              read: perm.read,
              write: perm.write,
              manageProject: perm.manage_project,
              manageMembers: perm.manage_members,
              managePermissions: perm.manage_permissions
            })
          } else {
            // Crear nuevos permisos
            await permissionService.createPermission({
              projectId,
              userId: perm.userId,
              role: perm.role,
              read: perm.read,
              write: perm.write,
              manageProject: perm.manage_project,
              manageMembers: perm.manage_members,
              managePermissions: perm.manage_permissions
            })
          }
        } catch (error) {
          console.error(`Error updating permissions for user ${perm.userId}:`, error)
          throw error
        }
      })
      
      await Promise.all(updatePromises)
      
      toast({
        title: "Permisos actualizados",
        description: "Los cambios en permisos se han guardado correctamente.",
      })
      
      onPermissionsUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los permisos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMembers = projectMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Permisos del Proyecto</DialogTitle>
          <DialogDescription>
            Configura los permisos de acceso para cada miembro del equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar miembros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px] flex-1 overflow-hidden">
            {/* Lista de miembros - Columna izquierda */}
            <div className="space-y-2 md:border-r md:pr-4 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Miembros del Proyecto</Label>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No se encontraron miembros
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const userPerms = getUserPermissions(member.id)
                    if (!userPerms) return null

                    const permissionLevel = getPermissionLevel(userPerms)
                    const isCurrentUser = member.id === currentUser.id
                    const isSelected = selectedMemberId === member.id

                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                          ${isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50 border-border'
                          }
                        `}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{member.name}</p>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">Tú</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(userPerms.role)}
                            </Badge>
                            <Badge className={`text-xs ${permissionLevel.color}`}>
                              {permissionLevel.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Permisos del miembro seleccionado - Columna derecha */}
            <div className="space-y-4 overflow-y-auto max-h-[500px]">
              {selectedMemberId ? (() => {
                const selectedMember = projectMembers.find(m => m.id === selectedMemberId)
                const userPerms = getUserPermissions(selectedMemberId)
                
                if (!selectedMember || !userPerms) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      Selecciona un miembro para ver sus permisos
                    </div>
                  )
                }

                const permissionLevel = getPermissionLevel(userPerms)
                const isCurrentUser = selectedMember.id === currentUser.id

                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                            <AvatarFallback>
                              {selectedMember.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{selectedMember.name}</CardTitle>
                            <CardDescription>{selectedMember.email}</CardDescription>
                          </div>
                        </div>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(selectedMember.id, selectedMember.name)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar del proyecto"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Preset de permisos */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Preset de Permisos
                        </Label>
                        <Select 
                          onValueChange={(value: 'admin' | 'manager' | 'member' | 'viewer') => 
                            setPermissionPreset(selectedMember.id, value)
                          }
                          disabled={isCurrentUser}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar preset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin (Todos los permisos)</SelectItem>
                            <SelectItem value="manager">Manager (Gestionar proyecto y miembros)</SelectItem>
                            <SelectItem value="member">Miembro (Leer y escribir)</SelectItem>
                            <SelectItem value="viewer">Visualizador (Solo leer)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Rol en el proyecto */}
                      <div>
                        <Label htmlFor={`role-${selectedMember.id}`} className="text-sm font-medium mb-2 block">
                          Rol en el Proyecto
                        </Label>
                        <Select 
                          value={userPerms.role}
                          onValueChange={(value: ProjectRole) => updateRole(selectedMember.id, value)}
                          disabled={isCurrentUser}
                        >
                          <SelectTrigger id={`role-${selectedMember.id}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scrum_master">Scrum Master</SelectItem>
                            <SelectItem value="product_owner">Product Owner</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="tester">Tester</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="stakeholder">Stakeholder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Permisos individuales */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">
                          Permisos Individuales
                        </Label>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <Label htmlFor={`read-${selectedMember.id}`} className="text-sm font-medium">
                                Leer
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Ver información del proyecto
                              </p>
                            </div>
                            <Switch
                              id={`read-${selectedMember.id}`}
                              checked={userPerms.read}
                              onCheckedChange={(checked) => updatePermission(selectedMember.id, 'read', checked)}
                              disabled={isCurrentUser}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <Label htmlFor={`write-${selectedMember.id}`} className="text-sm font-medium">
                                Escribir
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Crear y editar contenido
                              </p>
                            </div>
                            <Switch
                              id={`write-${selectedMember.id}`}
                              checked={userPerms.write}
                              onCheckedChange={(checked) => updatePermission(selectedMember.id, 'write', checked)}
                              disabled={isCurrentUser}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <Label htmlFor={`manage-project-${selectedMember.id}`} className="text-sm font-medium">
                                Gestionar Proyecto
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Editar configuración del proyecto
                              </p>
                            </div>
                            <Switch
                              id={`manage-project-${selectedMember.id}`}
                              checked={userPerms.manage_project}
                              onCheckedChange={(checked) => updatePermission(selectedMember.id, 'manage_project', checked)}
                              disabled={isCurrentUser}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <Label htmlFor={`manage-members-${selectedMember.id}`} className="text-sm font-medium">
                                Gestionar Miembros
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Agregar o eliminar miembros
                              </p>
                            </div>
                            <Switch
                              id={`manage-members-${selectedMember.id}`}
                              checked={userPerms.manage_members}
                              onCheckedChange={(checked) => updatePermission(selectedMember.id, 'manage_members', checked)}
                              disabled={isCurrentUser}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <Label htmlFor={`manage-permissions-${selectedMember.id}`} className="text-sm font-medium">
                                Gestionar Permisos
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Modificar permisos de otros usuarios
                              </p>
                            </div>
                            <Switch
                              id={`manage-permissions-${selectedMember.id}`}
                              checked={userPerms.manage_permissions}
                              onCheckedChange={(checked) => updatePermission(selectedMember.id, 'manage_permissions', checked)}
                              disabled={isCurrentUser || !isAdmin}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Resumen del nivel de permisos */}
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Nivel de Permisos:</span>
                          <Badge className={permissionLevel.color}>
                            {permissionLevel.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })() : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecciona un miembro de la lista</p>
                    <p className="text-xs mt-2">para ver y editar sus permisos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Diálogo de confirmación para eliminar miembro */}
    <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro de que deseas eliminar a {userToRemove?.name} del proyecto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. El usuario será eliminado del proyecto y perderá todos sus permisos. 
            Se le enviará una notificación informándole de la eliminación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRemoveMember} className="bg-red-600 text-white hover:bg-red-700">
            Aceptar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}

