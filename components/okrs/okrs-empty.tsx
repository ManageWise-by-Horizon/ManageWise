"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Plus } from "lucide-react"

interface OKRsEmptyProps {
  onCreateFirst: () => void
  projectName?: string
}

export function OKRsEmpty({ onCreateFirst, projectName }: OKRsEmptyProps) {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardHeader className="text-center py-12">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Target className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          No hay OKRs definidos
        </CardTitle>
        <CardDescription className="text-gray-600 max-w-md mx-auto">
          {projectName 
            ? `El proyecto "${projectName}" aún no tiene OKRs definidos. Crea el primer objetivo para comenzar a establecer las metas del proyecto.`
            : "Aún no hay OKRs definidos en este proyecto. Crea el primer objetivo para comenzar a establecer las metas."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-12">
        <Button 
          onClick={onCreateFirst}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear primer OKR
        </Button>
      </CardContent>
    </Card>
  )
}