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
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Filtrar OKRs solo para este proyecto
      const allOkrs: OKR[] = [
        {
          id: "okr_001",
          projectId: "b3bc",
          title: "Lanzar versión beta funcional",
          description: "Desarrollar y lanzar una versión beta de la plataforma de ecommerce con funcionalidades básicas de compra y venta",
          type: "objective",
          ownerId: "1",
          quarter: "Q1 2026",
          status: "in_progress",
          progress: 35,
          startDate: "2025-10-22",
          endDate: "2026-02-28",
          createdAt: "2025-10-22T05:44:09.790Z",
          keyResults: [
            {
              id: "kr_001_1",
              title: "Completar 80% de las user stories del MVP",
              description: "Implementar las funcionalidades básicas de registro, login, búsqueda y carrito",
              targetValue: 80,
              currentValue: 25,
              unit: "percentage",
              status: "in_progress"
            },
            {
              id: "kr_001_2", 
              title: "Realizar pruebas con 50 usuarios beta",
              description: "Ejecutar testing con usuarios reales para validar funcionalidades",
              targetValue: 50,
              currentValue: 0,
              unit: "users",
              status: "not_started"
            },
            {
              id: "kr_001_3",
              title: "Lograr tiempo de carga inferior a 3 segundos",
              description: "Optimizar rendimiento de la aplicación",
              targetValue: 3,
              currentValue: 5.2,
              unit: "seconds",
              status: "in_progress"
            }
          ]
        },
        {
          id: "okr_002",
          projectId: "b3bc",
          title: "Integrar sistema de pagos robusto",
          description: "Implementar múltiples pasarelas de pago para facilitar las transacciones",
          type: "objective",
          ownerId: "3",
          quarter: "Q1 2026",
          status: "not_started",
          progress: 0,
          startDate: "2026-01-15",
          endDate: "2026-03-31",
          createdAt: "2025-10-22T05:44:09.790Z",
          keyResults: [
            {
              id: "kr_002_1",
              title: "Integrar 3 pasarelas de pago diferentes",
              description: "PayPal, Stripe y procesador local",
              targetValue: 3,
              currentValue: 0,
              unit: "integrations",
              status: "not_started"
            },
            {
              id: "kr_002_2",
              title: "Lograr 99.9% de disponibilidad del sistema de pagos",
              description: "Garantizar alta disponibilidad y confiabilidad",
              targetValue: 99.9,
              currentValue: 0,
              unit: "percentage",
              status: "not_started"
            },
            {
              id: "kr_002_3",
              title: "Procesar transacciones en menos de 5 segundos",
              description: "Optimizar tiempo de procesamiento de pagos",
              targetValue: 5,
              currentValue: 0,
              unit: "seconds",
              status: "not_started"
            }
          ]
        },
        {
          id: "okr_003",
          projectId: "b3bc",
          title: "Alcanzar métricas de satisfacción del cliente",
          description: "Lograr alta satisfacción del cliente medida a través de reseñas y feedback",
          type: "objective",
          ownerId: "2",
          quarter: "Q3 2026",
          status: "not_started",
          progress: 0,
          startDate: "2026-07-01",
          endDate: "2026-09-30",
          createdAt: "2025-10-22T05:44:09.790Z",
          keyResults: [
            {
              id: "kr_003_1",
              title: "Obtener rating promedio de 4.5 estrellas",
              description: "Medido en reseñas de usuarios en la plataforma",
              targetValue: 4.5,
              currentValue: 0,
              unit: "rating",
              status: "not_started"
            },
            {
              id: "kr_003_2",
              title: "Reducir tickets de soporte a menos de 50 por mes",
              description: "Mejorar UX para reducir consultas de soporte",
              targetValue: 50,
              currentValue: 0,
              unit: "tickets",
              status: "not_started"
            },
            {
              id: "kr_003_3",
              title: "Alcanzar 90% de resolución en primer contacto",
              description: "Eficiencia en resolución de problemas de clientes",
              targetValue: 90,
              currentValue: 0,
              unit: "percentage",
              status: "not_started"
            }
          ]
        }
      ]

      // Filtrar solo OKRs de este proyecto
      const projectOkrs = allOkrs.filter(okr => okr.projectId === projectId)
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