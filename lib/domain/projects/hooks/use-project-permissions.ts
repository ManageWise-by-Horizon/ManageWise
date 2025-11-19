"use client"

import { useState, useCallback, useEffect } from 'react'
import { permissionService, type CreatePermissionCommand, type UpdatePermissionCommand } from '../services/permission.service'
import type { ProjectPermission } from '../types/project.types'

export function useProjectPermissions(projectId?: number) {
  const [permissions, setPermissions] = useState<ProjectPermission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await permissionService.getPermissionsByProjectId(String(id))
      const permissionsArray = Array.isArray(data) ? data : []
      setPermissions(permissionsArray)
      return permissionsArray
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      // No lanzar el error, solo guardarlo. Si no hay permisos, es normal (proyecto nuevo)
      setPermissions([])
      // No hacer throw para evitar que rompa la UI
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar permisos automáticamente cuando se proporciona un projectId
  useEffect(() => {
    if (projectId) {
      fetchPermissions(projectId).catch(() => {
        // Error ya manejado en fetchPermissions
      })
    }
  }, [projectId, fetchPermissions])

  const createPermission = useCallback(async (command: CreatePermissionCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newPermission = await permissionService.createPermission(command)
      setPermissions(prev => [...prev, newPermission])
      return newPermission
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePermission = useCallback(async (id: number | string, command: UpdatePermissionCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await permissionService.updatePermission(String(id), command)
      setPermissions(prev => prev.map(p => String(p.id) === String(id) ? updated : p))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deletePermission = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      await permissionService.deletePermission(String(id))
      setPermissions(prev => prev.filter(p => String(p.id) !== String(id)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    permissions,
    isLoading,
    error,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission
  }
}

