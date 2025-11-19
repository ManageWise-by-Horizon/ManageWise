"use client"

import { useState, useEffect, useCallback } from 'react'
import { projectService } from '../services/project.service'
import type { Project, CreateProjectCommand } from '../types/project.types'
import { useAuth } from '@/lib/auth/auth-context'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Query: Obtener todos los proyectos
  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let data: Project[]
      
      if (user?.id) {
        // Obtener proyectos del usuario
        data = await projectService.getProjectsByUserId(user.id)
      } else {
        // Obtener todos los proyectos
        data = await projectService.getAllProjects()
      }
      
      // Asegurar que sea un array
      const projectsArray = Array.isArray(data) ? data : []
      setProjects(projectsArray)
      return projectsArray
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      setProjects([])
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Command: Crear proyecto
  const createProject = useCallback(async (command: CreateProjectCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newProject = await projectService.createProject(command)
      setProjects(prev => [...prev, newProject])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Command: Eliminar proyecto
  const deleteProject = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)
    try {
      await projectService.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    deleteProject,
    refetch: fetchProjects
  }
}

