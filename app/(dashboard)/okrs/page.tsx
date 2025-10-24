"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { OKRCard } from "@/components/okrs/okr-card"
import { OKRFilters } from "@/components/okrs/okr-filters"
import { 
  OKRsLoading, 
  OKRsError, 
  OKRsEmpty, 
  OKRsNoResults 
} from "@/components/okrs/okr-states"
import { createApiUrl } from "@/lib/api-config"

interface KeyResult {
  id: string
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  status: "not_started" | "in_progress" | "completed" | "at_risk"
}

interface OKR {
  id: string
  projectId: string
  title: string
  description: string
  type: "objective"
  ownerId: string
  quarter: string
  status: "not_started" | "in_progress" | "completed" | "at_risk"
  progress: number
  startDate: string
  endDate: string
  createdAt: string
  keyResults: KeyResult[]
}

interface User {
  id: string
  name: string
  avatar?: string
}

export default function OKRsPage() {
  const { user } = useAuth()
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOwner, setFilterOwner] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterQuarter, setFilterQuarter] = useState<string>("all")

  // Cargar datos desde la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Cargar OKRs y usuarios desde la API real
        const [okrsResponse, usersResponse] = await Promise.all([
          fetch(createApiUrl('/okrs')),
          fetch(createApiUrl('/users'))
        ])
        
        if (!okrsResponse.ok || !usersResponse.ok) {
          throw new Error('Error al cargar los datos')
        }
        
        const okrsData = await okrsResponse.json()
        const usersData = await usersResponse.json()

        setOkrs(okrsData)
        setUsers(usersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar OKRs
  const filteredOkrs = okrs.filter(okr => {
    const matchesSearch = okr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         okr.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOwner = filterOwner === "all" || okr.ownerId === filterOwner
    const matchesStatus = filterStatus === "all" || okr.status === filterStatus
    const matchesQuarter = filterQuarter === "all" || okr.quarter === filterQuarter
    
    return matchesSearch && matchesOwner && matchesStatus && matchesQuarter
  })

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.name || "Usuario desconocido"
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleCreateFirst = () => {
    // Implementar creación de OKR
    console.log("Crear primer OKR")
  }

  const handleCreateOKR = () => {
    // Implementar creación de OKR
    console.log("Crear nuevo OKR")
  }

  const handleEditOKR = (okr: OKR) => {
    // Implementar edición de OKR
    console.log("Editar OKR:", okr)
  }

  const handleDeleteOKR = (okrId: string) => {
    // Implementar eliminación de OKR
    console.log("Eliminar OKR:", okrId)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilterOwner("all")
    setFilterStatus("all")
    setFilterQuarter("all")
  }

  if (loading) {
    return <OKRsLoading />
  }

  if (error) {
    return <OKRsError error={error} onRetry={handleRetry} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            OKRs del Proyecto
          </h1>
          <p className="text-gray-600 mt-2">
            Objetivos y Resultados Clave para monitorear el progreso del equipo
          </p>
        </div>
        <Button onClick={handleCreateOKR}>
          <Target className="h-4 w-4 mr-2" />
          Crear OKR
        </Button>
      </div>

      {/* Dashboard vacío */}
      {okrs.length === 0 && (
        <OKRsEmpty onCreateFirst={handleCreateFirst} />
      )}

      {/* Contenido cuando hay OKRs */}
      {okrs.length > 0 && (
        <>
          {/* Filtros */}
          <OKRFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterOwner={filterOwner}
            setFilterOwner={setFilterOwner}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterQuarter={filterQuarter}
            setFilterQuarter={setFilterQuarter}
            users={users}
            onClearFilters={handleClearFilters}
          />

          {/* Dashboard con filtros sin resultados */}
          {filteredOkrs.length === 0 && <OKRsNoResults />}

          {/* Lista de OKRs */}
          {filteredOkrs.length > 0 && (
            <div className="grid gap-6">
              {filteredOkrs.map((okr) => (
                <OKRCard 
                  key={okr.id} 
                  okr={okr} 
                  getUserName={getUserName}
                  onEdit={handleEditOKR}
                  onDelete={handleDeleteOKR}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}