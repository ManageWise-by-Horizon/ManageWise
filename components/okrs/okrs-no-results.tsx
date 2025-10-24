"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface OKRsNoResultsProps {
  onClearFilters?: () => void
}

export function OKRsNoResults({ onClearFilters }: OKRsNoResultsProps) {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardHeader className="text-center py-12">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          No se encontraron OKRs
        </CardTitle>
        <CardDescription className="text-gray-600 max-w-md mx-auto">
          No hay OKRs que coincidan con los filtros aplicados. Prueba ajustar los criterios de búsqueda o limpia los filtros para ver todos los OKRs.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-12">
        {onClearFilters && (
          <Button 
            onClick={onClearFilters}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  )
}