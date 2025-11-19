"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { projectService } from '../services/project.service'
import type { Project, CreateProjectCommand, UpdateProjectCommand, GetProjectQuery } from '../types/project.types'

export function useProject(query?: GetProjectQuery) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estabilizar el query usando useMemo para evitar recreaciones innecesarias
  const stableQuery = useMemo(() => {
    if (!query) return undefined
    return {
      id: query.id,
      projectId: query.projectId,
      userId: query.userId
    }
  }, [query?.id, query?.projectId, query?.userId])
  
  // Usar useRef para evitar llamadas duplicadas
  const lastQueryRef = useRef<GetProjectQuery | undefined>(undefined)

  // Query: Obtener proyecto
  const fetchProject = useCallback(async (queryParams: GetProjectQuery) => {
    // Validar que tengamos al menos un identificador
    if (!queryParams.id && !queryParams.projectId) {
      console.warn('[useProject] fetchProject called without id or projectId')
      setProject(null)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await projectService.getProject(queryParams)
      setProject(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      // Si es un 404, no establecer error (el proyecto simplemente no existe)
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        console.warn('[useProject] Project not found (404), setting project to null')
        setProject(null)
        setError(null) // No mostrar error para 404
      } else {
        setError(errorMessage)
      }
      // No lanzar el error para 404, solo para otros errores
      if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
        throw err
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Crear proyecto
  const createProject = useCallback(async (command: CreateProjectCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newProject = await projectService.createProject(command)
      setProject(newProject)
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Actualizar proyecto
  const updateProject = useCallback(async (id: string, command: UpdateProjectCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await projectService.updateProject(id, command)
      setProject(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Eliminar proyecto
  const deleteProject = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await projectService.deleteProject(id)
      setProject(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Agregar miembro
  const addMember = useCallback(async (projectId: string, memberId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await projectService.addMember(projectId, memberId)
      setProject(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Remover miembro
  const removeMember = useCallback(async (projectId: string, memberId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await projectService.removeMember(projectId, memberId)
      setProject(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Solo ejecutar si el query cambió y no es el mismo que la última vez
    if (stableQuery) {
      // Validar que tengamos al menos un identificador válido
      if (!stableQuery.id && !stableQuery.projectId) {
        console.warn('[useProject] useEffect: query provided but no id or projectId')
        return
      }

      // Comparar si el query realmente cambió
      const hasChanged = 
        stableQuery.id !== lastQueryRef.current?.id ||
        stableQuery.projectId !== lastQueryRef.current?.projectId ||
        stableQuery.userId !== lastQueryRef.current?.userId
      
      if (hasChanged) {
        lastQueryRef.current = stableQuery
        fetchProject(stableQuery).catch(err => {
          // El error ya se maneja en fetchProject, solo loguear aquí
          console.error('[useProject] Error in useEffect fetchProject:', err)
        })
      }
    } else {
      // Si no hay query, limpiar el estado
      lastQueryRef.current = undefined
      setProject(null)
    }
  }, [stableQuery, fetchProject])

  return {
    project,
    isLoading,
    error,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    refetch: () => query && fetchProject(query)
  }
}

