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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, Users, Settings, Lock, UserX } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

interface UserPermissions {
  userId: string
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

  useEffect(() => {
    if (open) {
      fetchMembersAndPermissions()
    }
  }, [open, projectId])

  const fetchMembersAndPermissions = async () => {
    try {
      setIsLoading(true)
      
      // Cargar usuarios reales desde la API
      const usersResponse = await fetch('http://localhost:3001/users')
      if (!usersResponse.ok) {
        throw new Error('Error al cargar usuarios')
      }
      const allUsers = await usersResponse.json()
      
      // Cargar proyecto para obtener miembros
      const projectResponse = await fetch(`http://localhost:3001/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error('Error al cargar proyecto')
      }
      const project = await projectResponse.json()
      
      // Filtrar solo los usuarios que son miembros del proyecto
      const projectMembers = allUsers.filter((user: User) => 
        project.members.includes(user.id)
      )
      
      // Cargar permisos reales del proyecto
      const permissionsResponse = await fetch(`http://localhost:3001/projectPermissions?projectId=${projectId}`)
      let projectPermissions: UserPermissions[] = []
      
      if (permissionsResponse.ok) {
        projectPermissions = await permissionsResponse.json()
      }
      
      // Si no hay permisos, crear permisos por defecto basados en roles
      if (projectPermissions.length === 0) {
        projectPermissions = projectMembers.map((member: User) => ({
          userId: member.id,
          read: true,
          write: member.role !== 'developer',
          manage_project: member.role === 'scrum_master' || member.role === 'product_owner',
          manage_members: member.role === 'scrum_master',
          manage_permissions: member.role === 'scrum_master'
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

  const updatePermission = (userId: string, permission: keyof Omit<UserPermissions, 'userId'>, value: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, [permission]: value }
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

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <CardDescription>{member.email}</CardDescription>
                        </div>
                        {isCurrentUser && (
                          <Badge variant="outline">Tú</Badge>
                        )}
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
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
  )
}
