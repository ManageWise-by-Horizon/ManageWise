/**
 * Utility functions for managing project permissions and roles
 */

export interface ProjectPermission {
  userId: string
  role: "admin" | "manager" | "contributor" | "viewer"
  permissions: string[]
  addedAt: string
  addedBy: string
}

export interface ProjectWithPermissions {
  id: string
  name: string
  description: string
  objectives: string[]
  timeline: {
    start?: string
    end?: string
    startDate?: string
    estimatedEndDate?: string
  }
  members: string[]
  createdBy: string
  createdAt: string
  status: string
  permissions?: { [userId: string]: ProjectPermission }
}

export const ROLE_PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_members", "manage_permissions", "manage_project"],
  manager: ["read", "write", "delete", "manage_members"],
  contributor: ["read", "write"],
  viewer: ["read"]
}

export const PERMISSION_LABELS = {
  read: "Ver proyecto",
  write: "Crear/Editar contenido",
  delete: "Eliminar contenido",
  manage_members: "Gestionar miembros",
  manage_permissions: "Gestionar permisos",
  manage_project: "Configurar proyecto"
}

export const PROJECT_ROLES = {
  admin: {
    label: "Administrador",
    description: "Control total del proyecto",
    permissions: ROLE_PERMISSIONS.admin,
    color: "bg-red-500"
  },
  manager: {
    label: "Gestor",
    description: "Puede gestionar contenido y miembros",
    permissions: ROLE_PERMISSIONS.manager,
    color: "bg-blue-500"
  },
  contributor: {
    label: "Colaborador",
    description: "Puede crear y editar contenido",
    permissions: ROLE_PERMISSIONS.contributor,
    color: "bg-green-500"
  },
  viewer: {
    label: "Observador",
    description: "Solo lectura",
    permissions: ROLE_PERMISSIONS.viewer,
    color: "bg-gray-500"
  }
}

/**
 * Get user's role in a specific project
 */
export async function getUserProjectRole(projectId: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
    if (!response.ok) return null
    
    const project: ProjectWithPermissions = await response.json()
    
    // Check if user is a member
    if (!project.members.includes(userId)) return null
    
    // Check project-specific permissions first
    if (project.permissions && project.permissions[userId]) {
      return project.permissions[userId].role
    }
    
    // Default: creator is admin, others are contributors
    return project.createdBy === userId ? "admin" : "contributor"
  } catch (error) {
    console.error("Error getting user project role:", error)
    return null
  }
}

/**
 * Check if user has specific permission in project
 */
export async function hasProjectPermission(
  projectId: string, 
  userId: string, 
  permission: string
): Promise<boolean> {
  const role = await getUserProjectRole(projectId, userId)
  if (!role) return false
  
  const rolePermissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
  return rolePermissions.includes(permission)
}

/**
 * Update user role in project
 */
export async function updateUserProjectRole(
  projectId: string,
  userId: string,
  newRole: string,
  updatedBy: string
): Promise<boolean> {
  try {
    // Get current project
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
    if (!response.ok) return false
    
    const project: ProjectWithPermissions = await response.json()
    
    // Initialize permissions object if it doesn't exist
    if (!project.permissions) {
      project.permissions = {}
    }
    
    // Update or create permission entry
    project.permissions[userId] = {
      userId,
      role: newRole as any,
      permissions: ROLE_PERMISSIONS[newRole as keyof typeof ROLE_PERMISSIONS],
      addedAt: new Date().toISOString(),
      addedBy: updatedBy
    }
    
    // Update project
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: project.permissions })
    })
    
    return updateResponse.ok
  } catch (error) {
    console.error("Error updating user project role:", error)
    return false
  }
}

/**
 * Remove user from project (including permissions)
 */
export async function removeUserFromProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get current project
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
    if (!response.ok) return false
    
    const project: ProjectWithPermissions = await response.json()
    
    // Remove from members array
    const updatedMembers = project.members.filter(id => id !== userId)
    
    // Remove from permissions
    const updatedPermissions = { ...project.permissions }
    if (updatedPermissions[userId]) {
      delete updatedPermissions[userId]
    }
    
    // Update project
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        members: updatedMembers,
        permissions: updatedPermissions
      })
    })
    
    return updateResponse.ok
  } catch (error) {
    console.error("Error removing user from project:", error)
    return false
  }
}

/**
 * Get all members with their roles for a project
 */
export async function getProjectMembersWithRoles(projectId: string) {
  try {
    // Get project
    const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
    if (!projectRes.ok) return []
    
    const project: ProjectWithPermissions = await projectRes.json()
    
    // Get all users
    const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
    if (!usersRes.ok) return []
    
    const users = await usersRes.json()
    
    // Filter project members and add role information
    return users
      .filter((user: any) => project.members.includes(user.id))
      .map((user: any) => ({
        ...user,
        projectRole: project.permissions?.[user.id]?.role || 
                    (project.createdBy === user.id ? "admin" : "contributor"),
        projectPermissions: project.permissions?.[user.id]?.permissions || 
                           ROLE_PERMISSIONS[project.createdBy === user.id ? "admin" : "contributor"]
      }))
  } catch (error) {
    console.error("Error getting project members with roles:", error)
    return []
  }
}