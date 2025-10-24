"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  Target, 
  Search, 
  AlertTriangle, 
  RefreshCw,
  Plus
} from "lucide-react"

// Loading skeleton
export function OKRsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40 mb-2" />
                  {[1, 2, 3].map(j => (
                    <div key={j} className="border rounded-lg p-3">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Error state
interface OKRsErrorProps {
  error: string
  onRetry: () => void
}

export function OKRsError({ error, onRetry }: OKRsErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Error al cargar OKRs</h3>
        <p className="text-gray-600 mt-2">{error}</p>
        <p className="text-sm text-gray-500 mt-1">
          Verifica tu conexión a internet e intenta nuevamente
        </p>
      </div>
      <Button onClick={onRetry} className="mt-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </Button>
    </div>
  )
}

// Empty state - no OKRs exist
interface OKRsEmptyProps {
  onCreateFirst: () => void
  projectName?: string
}

export function OKRsEmpty({ onCreateFirst, projectName }: OKRsEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <Target className="h-16 w-16 text-gray-300" />
        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
          <Plus className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {projectName ? `No hay OKRs definidos para "${projectName}"` : "No hay OKRs definidos"}
        </h3>
        <p className="text-gray-600 mt-2">
          Los OKRs (Objetivos y Resultados Clave) te ayudan a establecer metas claras y medir el progreso de tu equipo en este proyecto específico.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {projectName 
            ? `Comienza creando el primer objetivo para "${projectName}".`
            : "Comienza creando tu primer objetivo para este proyecto."
          }
        </p>
      </div>
      <Button onClick={onCreateFirst} size="lg">
        <Target className="h-4 w-4 mr-2" />
        Crear primer OKR
      </Button>
    </div>
  )
}

// No results from filters
export function OKRsNoResults() {
  return (
    <Alert className="my-6">
      <Search className="h-4 w-4" />
      <AlertDescription>
        No se encontraron OKRs que coincidan con los filtros seleccionados.
        Intenta ajustar los criterios de búsqueda o limpiar los filtros.
      </AlertDescription>
    </Alert>
  )
}