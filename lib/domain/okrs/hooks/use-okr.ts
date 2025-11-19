"use client"

import { useState, useCallback } from 'react'
import { okrService } from '../services/okr.service'
import type { 
  Okr, 
  KeyResult,
  CreateOkrCommand,
  UpdateOkrCommand,
  CreateKeyResultCommand,
  UpdateKeyResultCommand
} from '../types/okr.types'

export function useOkr(okrId?: number | string) {
  const [okr, setOkr] = useState<Okr | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOkr = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await okrService.getOkrById(String(id))
      setOkr(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createOkr = useCallback(async (command: CreateOkrCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newOkr = await okrService.createOkr(command)
      setOkr(newOkr)
      return newOkr
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateOkr = useCallback(async (id: number | string, command: UpdateOkrCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await okrService.updateOkr(String(id), command)
      setOkr(updated)
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteOkr = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      await okrService.deleteOkr(String(id))
      setOkr(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    okr,
    isLoading,
    error,
    fetchOkr,
    createOkr,
    updateOkr,
    deleteOkr
  }
}

export function useOkrs(projectId?: number) {
  const [okrs, setOkrs] = useState<Okr[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOkrs = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await okrService.getOkrsByProjectId(String(id))
      const okrsArray = Array.isArray(data) ? data : []
      setOkrs(okrsArray)
      return okrsArray
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      setOkrs([])
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createOkr = useCallback(async (command: CreateOkrCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newOkr = await okrService.createOkr(command)
      setOkrs(prev => [...prev, newOkr])
      return newOkr
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteOkr = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      await okrService.deleteOkr(String(id))
      setOkrs(prev => prev.filter(o => String(o.id) !== String(id)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    okrs,
    isLoading,
    error,
    fetchOkrs,
    createOkr,
    deleteOkr
  }
}

export function useKeyResults(okrId?: number) {
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeyResults = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await okrService.getKeyResultsByOkrId(String(id))
      const keyResultsArray = Array.isArray(data) ? data : []
      setKeyResults(keyResultsArray)
      return keyResultsArray
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      setKeyResults([])
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createKeyResult = useCallback(async (command: CreateKeyResultCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const newKeyResult = await okrService.createKeyResult(command)
      setKeyResults(prev => [...prev, newKeyResult])
      return newKeyResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateKeyResult = useCallback(async (id: number | string, command: UpdateKeyResultCommand) => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await okrService.updateKeyResult(String(id), command)
      setKeyResults(prev => prev.map(kr => String(kr.id) === String(id) ? updated : kr))
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteKeyResult = useCallback(async (id: number | string) => {
    setIsLoading(true)
    setError(null)
    try {
      await okrService.deleteKeyResult(String(id))
      setKeyResults(prev => prev.filter(kr => String(kr.id) !== String(id)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    keyResults,
    isLoading,
    error,
    fetchKeyResults,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult
  }
}

