"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Target, 
  Users, 
  Calendar, 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getOKRStatusColor } from "@/lib/ui-helpers"

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

interface OKRCardProps {
  okr: OKR
  getUserName: (userId: string) => string
  onEdit?: (okr: OKR) => void
  onDelete?: (okrId: string) => void
}

export function OKRCard({ okr, getUserName, onEdit, onDelete }: OKRCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "at_risk":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "not_started":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "in_progress":
        return "En progreso"
      case "at_risk":
        return "En riesgo"
      case "not_started":
        return "No iniciado"
      default:
        return "Desconocido"
    }
  }

  const calculateKeyResultProgress = (kr: KeyResult) => {
    if (kr.unit === "percentage") {
      return Math.min(100, (kr.currentValue / kr.targetValue) * 100)
    } else if (kr.unit === "seconds") {
      // Para tiempo, menor es mejor
      return Math.max(0, Math.min(100, ((kr.targetValue - kr.currentValue + kr.targetValue) / kr.targetValue) * 100))
    } else {
      return Math.min(100, (kr.currentValue / kr.targetValue) * 100)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-3">
              {getStatusIcon(okr.status)}
              {okr.title}
            </CardTitle>
            <CardDescription className="mt-2">
              {okr.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getOKRStatusColor(okr.status)}>
              {getStatusLabel(okr.status)}
            </Badge>
            <Badge variant="outline">{okr.quarter}</Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(okr)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(okr.id)}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Responsable: {getUserName(okr.ownerId)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(okr.startDate).toLocaleDateString()} - {new Date(okr.endDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso general</span>
              <span className="text-sm text-gray-600">{okr.progress}%</span>
            </div>
            <Progress value={okr.progress} className="h-2" />
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Resultados Clave ({okr.keyResults.length})
            </h4>
            <div className="space-y-3">
              {okr.keyResults.map((kr) => (
                <div key={kr.id} className="border rounded-lg p-3 bg-gray-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium flex items-center gap-2 text-sm">
                        {getStatusIcon(kr.status)}
                        {kr.title}
                      </h5>
                      <p className="text-xs text-gray-600 mt-1">
                        {kr.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600">
                      {kr.unit === "seconds" ? (
                        `Actual: ${kr.currentValue}s / Meta: ${kr.targetValue}s`
                      ) : (
                        `Progreso: ${kr.currentValue} / ${kr.targetValue} ${kr.unit}`
                      )}
                    </span>
                    <span className="font-medium">
                      {Math.round(calculateKeyResultProgress(kr))}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={calculateKeyResultProgress(kr)} 
                    className="h-1.5" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}