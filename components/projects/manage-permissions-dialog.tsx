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

  useEffect(() => {
    if (open) {
      fetchMembersAndPermissions()
    }
  }, [open, projectId])

  const fetchMembersAndPermissions = async () => {
    try {
      setIsLoading(true)
      
      // Cargar datos en paralelo
      const [usersResponse, projectResponse, permissionsResponse] = await Promise.all([
        fetch(createApiUrl('/users')),
        fetch(createApiUrl(`/projects/${projectId}`)),
        fetch(createApiUrl(`/projectPermissions?projectId=${projectId}`))
      ])
      
      if (!usersResponse.ok || !projectResponse.ok) {
        throw new Error('Error al cargar datos')
      }
      
      const [allUsers, project] = await Promise.all([
        usersResponse.json(),
        projectResponse.json()
      ])
      
      // Filtrar miembros del proyecto
      const projectMembers = allUsers.filter((user: User) => 
        project.members.includes(user.id)
      )
      
      // Obtener permisos o crear por defecto
      let projectPermissions: UserPermissions[] = []
      if (permissionsResponse.ok) {
        projectPermissions = await permissionsResponse.json()
      }
      
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
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function para actualizar permisos de un usuario
  const updateUserPermissions = (userId: string, updates: Partial<UserPermissions>) => {
    setPermissions(prev => 
      prev.map(p => p.userId === userId ? { ...p, ...updates } : p)
    )
  }

  const updatePermission = (userId: string, permission: keyof Omit<UserPermissions, 'userId' | 'role'>, value: boolean) => {
    updateUserPermissions(userId, { [permission]: value })
  }

  const updateRole = (userId: string, role: ProjectRole) => {
    updateUserPermissions(userId, { role })
  }

  // Presets de permisos predefinidos
  const PERMISSION_PRESETS = {
    admin: { read: true, write: true, manage_project: true, manage_members: true, manage_permissions: true },
    manager: { read: true, write: true, manage_project: true, manage_members: true, manage_permissions: false },
    member: { read: true, write: true, manage_project: false, manage_members: false, manage_permissions: false },
    viewer: { read: true, write: false, manage_project: false, manage_members: false, manage_permissions: false }
  } as const

  const setPermissionPreset = (userId: string, preset: keyof typeof PERMISSION_PRESETS) => {
    updateUserPermissions(userId, PERMISSION_PRESETS[preset])
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

  // Helper function para crear notificación de eliminación
  const createRemovalNotification = (userId: string, projectName: string) => ({
    id: `notif_removed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    projectId,
    type: "member_removed",
    title: "Has sido removido del proyecto",
    message: `Has sido eliminado del proyecto "${projectName}" por ${currentUser.name}`,
    data: {
      projectId,
      projectName,
      removedBy: currentUser.id,
      removedByName: currentUser.name,
      changeType: "removed"
    },
    read: false,
    createdAt: new Date().toISOString(),
    deliveryStatus: "delivered"
  })

  const confirmRemoveMember = async () => {
    if (!userToRemove) return

    const { id: userId, name: userName } = userToRemove

    try {
      setIsLoading(true)
      setRemoveDialogOpen(false)

      // Obtener proyecto y permisos en paralelo
      const [projectRes, permsRes] = await Promise.all([
        fetch(createApiUrl(`/projects/${projectId}`)),
        fetch(createApiUrl(`/projectPermissions?projectId=${projectId}&userId=${userId}`))
      ])

      const [project, userPerms] = await Promise.all([
        projectRes.json(),
        permsRes.json()
      ])

      // Ejecutar operaciones de eliminación en paralelo
      const operations = [
        // Remover usuario del array de miembros
        fetch(createApiUrl(`/projects/${projectId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            members: project.members.filter((id: string) => id !== userId) 
          })
        }),
        // Crear notificación
        fetch(createApiUrl('/notifications'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createRemovalNotification(userId, project.name))
        })
      ]

      // Eliminar permisos si existen
      if (userPerms.length > 0) {
        operations.push(
          fetch(createApiUrl(`/projectPermissions/${userPerms[0].id}`), {
            method: 'DELETE'
          })
        )
      }

      await Promise.all(operations)

      toast({
        title: "Miembro eliminado",
        description: `${userName} ha sido eliminado del proyecto`,
      })

      // Recargar la lista de miembros
      setUserToRemove(null)
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

  // Helper function para guardar o actualizar permisos de un usuario
  const saveUserPermissions = async (perm: UserPermissions) => {
    const existingPermsResponse = await fetch(
      createApiUrl(`/projectPermissions?projectId=${projectId}&userId=${perm.userId}`)
    )
    const existingPerms = await existingPermsResponse.json()
    
    const permissionData = {
      projectId,
      userId: perm.userId,
      role: perm.role,
      read: perm.read,
      write: perm.write,
      manage_project: perm.manage_project,
      manage_members: perm.manage_members,
      manage_permissions: perm.manage_permissions
    }
    
    const url = existingPerms.length > 0 
      ? createApiUrl(`/projectPermissions/${existingPerms[0].id}`)
      : createApiUrl('/projectPermissions')
    
    const method = existingPerms.length > 0 ? 'PATCH' : 'POST'
    
    return fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissionData)
    })
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Actualizar todos los permisos en paralelo
      await Promise.all(permissions.map(saveUserPermissions))
      
      toast({
        title: "Permisos actualizados",
        description: "Los cambios en permisos se han guardado correctamente.",
      })
      
      onPermissionsUpdated()
      onOpenChange(false)
    } catch (error) {
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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
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

          {/* Lista de miembros */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {filteredMembers.map((member) => {
              const userPerms = getUserPermissions(member.id)
              if (!userPerms) return null

              const permissionLevel = getPermissionLevel(userPerms)
              const isCurrentUser = member.id === currentUser.id

              return (
                <Card key={member.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{member.name}</CardTitle>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">Tú</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {getRoleLabel(userPerms.role)}
                            </Badge>
                          </div>
                          <CardDescription>{member.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={permissionLevel.color}>
                          {permissionLevel.label}
                        </Badge>
                        <Select 
                          onValueChange={(value: 'admin' | 'manager' | 'member' | 'viewer') => 
                            setPermissionPreset(member.id, value)
                          }
                          disabled={isCurrentUser}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Preset" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="member">Miembro</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar del proyecto"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label htmlFor={`role-${member.id}`} className="text-sm font-medium mb-2 block">
                        Rol en el Proyecto
                      </Label>
                      <Select 
                        value={userPerms.role}
                        onValueChange={(value: ProjectRole) => updateRole(member.id, value)}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger id={`role-${member.id}`} className="w-full">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`read-${member.id}`} className="text-sm">Leer</Label>
                        <Switch
                          id={`read-${member.id}`}
                          checked={userPerms.read}
                          onCheckedChange={(checked) => updatePermission(member.id, 'read', checked)}
                          disabled={isCurrentUser}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`write-${member.id}`} className="text-sm">Escribir</Label>
                        <Switch
                          id={`write-${member.id}`}
                          checked={userPerms.write}
                          onCheckedChange={(checked) => updatePermission(member.id, 'write', checked)}
                          disabled={isCurrentUser}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`manage-project-${member.id}`} className="text-sm">Gestionar Proyecto</Label>
                        <Switch
                          id={`manage-project-${member.id}`}
                          checked={userPerms.manage_project}
                          onCheckedChange={(checked) => updatePermission(member.id, 'manage_project', checked)}
                          disabled={isCurrentUser}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`manage-members-${member.id}`} className="text-sm">Gestionar Miembros</Label>
                        <Switch
                          id={`manage-members-${member.id}`}
                          checked={userPerms.manage_members}
                          onCheckedChange={(checked) => updatePermission(member.id, 'manage_members', checked)}
                          disabled={isCurrentUser}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`manage-permissions-${member.id}`} className="text-sm">Gestionar Permisos</Label>
                        <Switch
                          id={`manage-permissions-${member.id}`}
                          checked={userPerms.manage_permissions}
                          onCheckedChange={(checked) => updatePermission(member.id, 'manage_permissions', checked)}
                          disabled={isCurrentUser || !isAdmin}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
