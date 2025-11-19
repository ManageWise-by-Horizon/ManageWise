"use client"

import { useState, useCallback, useEffect } from 'react'
import { profileService } from '../services/profile.service'
import type { UserProfile, UpdateUserProfileCommand, GetUserProfileQuery } from '../types/profile.types'

export function useProfile(query?: GetUserProfileQuery) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Query: Obtener perfil
  const fetchProfile = useCallback(async (queryParams: GetUserProfileQuery) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await profileService.getUserProfile(queryParams)
      setProfile(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar perfil automáticamente cuando se proporciona query
  useEffect(() => {
    if (query && (query.userId || query.userEmail)) {
      fetchProfile(query).catch(() => {
        // Error ya manejado en fetchProfile
      })
    }
  }, [query?.userId, query?.userEmail, fetchProfile])

  // Command: Actualizar perfil
  const updateProfile = useCallback(async (userId: string, command: UpdateUserProfileCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await profileService.updateUserProfile(userId, command)
      setProfile(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    refetch: query ? () => fetchProfile(query) : undefined
  }
}

