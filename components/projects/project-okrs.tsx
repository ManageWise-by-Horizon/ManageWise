"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { OKRCard } from "@/components/okrs/okr-card"
import { OKRFilters } from "@/components/okrs/okr-filters"
import { OKRsLoading, OKRsError } from "@/components/okrs/okr-states"
import { OKRsEmpty } from "@/components/okrs/okrs-empty"
import { OKRsNoResults } from "@/components/okrs/okrs-no-results"
import { CreateOKRDialog } from "@/components/okrs/create-okr-dialog"
import { EditOKRDialog } from "@/components/okrs/edit-okr-dialog"
import { DeleteOKRDialog } from "@/components/okrs/delete-okr-dialog"
import { createApiUrl, apiRequest } from "@/lib/api-config"

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

interface ProjectOKRsProps {
  projectId: string
  projectName: string
  members: User[]
}

export function ProjectOKRs({ projectId, projectName, members }: ProjectOKRsProps) {
  const { user } = useAuth()
  const [okrs, setOkrs] = useState<OKR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOwner, setFilterOwner] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterQuarter, setFilterQuarter] = useState<string>("all")
  
  // Estados para diálogos
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null)

  // Función para cargar OKRs del proyecto
  const fetchProjectOKRs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener OKRs reales desde la API
      const url = createApiUrl(`/okrs?projectId=${projectId}`)
      const response = await apiRequest(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los OKRs')
      }
      
      const projectOkrs = await response.json()
      setOkrs(projectOkrs)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar OKRs')
    } finally {
      setLoading(false)
    }
  }

  // Cargar OKRs específicos del proyecto
  useEffect(() => {
    fetchProjectOKRs()
  }, [projectId])

  // Filtrar OKRs según criterios de búsqueda
  const filteredOkrs = okrs.filter(okr => {
    const matchesSearch = okr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         okr.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOwner = filterOwner === "all" || okr.ownerId === filterOwner
    const matchesStatus = filterStatus === "all" || okr.status === filterStatus
    const matchesQuarter = filterQuarter === "all" || okr.quarter === filterQuarter
    
    return matchesSearch && matchesOwner && matchesStatus && matchesQuarter
  })

  const getUserName = (userId: string) => {
    const member = members.find(m => m.id === userId)
    return member?.name || "Usuario desconocido"
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleCreateFirst = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateOKR = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditOKR = (okr: OKR) => {
    setSelectedOKR(okr)
    setIsEditDialogOpen(true)
  }

  const handleDeleteOKR = (okrId: string) => {
    const okr = okrs.find(o => o.id === okrId)
    if (okr) {
      setSelectedOKR(okr)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleOKRCreated = () => {
    // Recargar OKRs después de crear
    fetchProjectOKRs()
  }

  const handleOKRUpdated = () => {
    // Recargar OKRs después de actualizar
    fetchProjectOKRs()
  }

  const handleOKRDeleted = () => {
    // Recargar OKRs después de eliminar
    fetchProjectOKRs()
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            OKRs del Proyecto
          </h2>
          <p className="text-gray-600 mt-1">
            Objetivos y Resultados Clave para "{projectName}"
          </p>
        </div>
        <Button onClick={handleCreateOKR}>
          <Target className="h-4 w-4 mr-2" />
          Crear OKR
        </Button>
      </div>

      {/* Dialogs CRUD */}
      <CreateOKRDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        projectName={projectName}
        members={members}
        onOKRCreated={handleOKRCreated}
      />
      <EditOKRDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        okr={selectedOKR}
        projectName={projectName}
        members={members}
        onOKRUpdated={handleOKRUpdated}
      />
      <DeleteOKRDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        okr={selectedOKR}
        projectName={projectName}
        onOKRDeleted={handleOKRDeleted}
      />

      {/* Dashboard vacío */}
      {okrs.length === 0 && (
        <OKRsEmpty onCreateFirst={handleCreateFirst} projectName={projectName} />
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
            users={members}
            onClearFilters={handleClearFilters}
          />

          {/* Dashboard con filtros sin resultados */}
          {filteredOkrs.length === 0 && <OKRsNoResults onClearFilters={handleClearFilters} />}

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