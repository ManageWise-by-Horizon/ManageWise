"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, RefreshCw, Mail, Clock, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { createApiUrl } from "@/lib/api-config"

interface ProjectInvitation {
  id: string
  projectId: string
  email: string
  invitedBy: string
  invitedByName: string
  message: string
  status: "pending" | "accepted" | "declined" | "expired"
  createdAt: string
  expiresAt: string
}

interface ProjectInvitationsProps {
  projectId: string
  onInvitationUpdated?: () => void
}

export function ProjectInvitations({ projectId, onInvitationUpdated }: ProjectInvitationsProps) {
  const { toast } = useToast()
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchInvitations()
  }, [projectId])

  const fetchInvitations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(createApiUrl(`/projectInvitations?projectId=${projectId}`))
      const data = await response.json()
      setInvitations(data)
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las invitaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resendInvitation = async (invitationId: string) => {
    try {
      // Simular reenvío de invitación
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Invitación reenviada",
        description: "La invitación ha sido reenviada por email",
      })
    } catch (error) {
      console.error("Error resending invitation:", error)
      toast({
        title: "Error",
        description: "No se pudo reenviar la invitación",
        variant: "destructive",
      })
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    try {
      await fetch(createApiUrl(`/projectInvitations/${invitationId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      toast({
        title: "Invitación cancelada",
        description: "La invitación ha sido cancelada",
      })

      fetchInvitations()
      onInvitationUpdated?.()
    } catch (error) {
      console.error("Error cancelling invitation:", error)
      toast({
        title: "Error",
        description: "No se pudo cancelar la invitación",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()
    
    if (isExpired && status === "pending") {
      return <Badge variant="destructive">Expirada</Badge>
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "accepted":
        return <Badge variant="default">Aceptada</Badge>
      case "declined":
        return <Badge variant="destructive">Rechazada</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invitaciones Pendientes
        </CardTitle>
        <CardDescription>
          Gestiona las invitaciones por email enviadas a usuarios externos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Cargando invitaciones...</p>
        ) : invitations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay invitaciones pendientes para este proyecto
          </p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const isExpired = new Date(invitation.expiresAt) < new Date()
              
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Invitado por {invitation.invitedByName}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(invitation.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      {invitation.message && (
                        <p className="text-xs text-muted-foreground italic max-w-md truncate">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(invitation.status, invitation.expiresAt)}
                    
                    {invitation.status === "pending" && !isExpired && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitation(invitation.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reenviar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}