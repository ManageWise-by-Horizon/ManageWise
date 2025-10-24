"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface User {
  id: string
  name: string
  avatar?: string
}

interface OKRFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterOwner: string
  setFilterOwner: (owner: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  filterQuarter: string
  setFilterQuarter: (quarter: string) => void
  users: User[]
  onClearFilters: () => void
}

export function OKRFilters({
  searchTerm,
  setSearchTerm,
  filterOwner,
  setFilterOwner,
  filterStatus,
  setFilterStatus,
  filterQuarter,
  setFilterQuarter,
  users,
  onClearFilters
}: OKRFiltersProps) {
  const hasActiveFilters = searchTerm || filterOwner !== "all" || filterStatus !== "all" || filterQuarter !== "all"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar OKRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsable</label>
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los responsables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los responsables</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="not_started">No iniciado</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="at_risk">En riesgo</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trimestre</label>
            <Select value={filterQuarter} onValueChange={setFilterQuarter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los trimestres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los trimestres</SelectItem>
                <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                <SelectItem value="Q4 2026">Q4 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}