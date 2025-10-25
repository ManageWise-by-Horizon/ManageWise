"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Check, X, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface InvitationNotificationProps {
  notification: {
    id: string
    title: string
    message: string
    data: {
      projectId?: string
      projectName?: string
      invitationId?: string
      invitedBy?: string
      invitedByName?: string
      email?: string
      changeType?: string
    }
    read: boolean
    createdAt: string
  }
  onAccept?: (notificationId: string, projectId: string) => Promise<void>
  onDecline?: (notificationId: string, invitationId?: string) => Promise<void>
  onMarkAsRead?: (notificationId: string) => Promise<void>
  compact?: boolean
}

export function InvitationNotification({
  notification,
  onAccept,
  onDecline,
  onMarkAsRead,
  compact = false
}: InvitationNotificationProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  const handleAccept = async () => {
    if (!onAccept || hasResponded || !notification.data.projectId) return
    
    setIsProcessing(true)
    try {
      await onAccept(notification.id, notification.data.projectId)
      setHasResponded(true)
      toast({
        title: "Invitación aceptada",
        description: `Te has unido al proyecto "${notification.data.projectName || 'desconocido'}"`,
      })
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast({
        title: "Error",
        description: "No se pudo aceptar la invitación. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!onDecline || hasResponded) return
    
    setIsProcessing(true)
    try {
      await onDecline(notification.id, notification.data.invitationId)
      setHasResponded(true)
      toast({
        title: "Invitación rechazada",
        description: "Has rechazado la invitación al proyecto",
      })
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast({
        title: "Error", 
        description: "No se pudo rechazar la invitación. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsRead = async () => {
    if (!onMarkAsRead) return
    await onMarkAsRead(notification.id)
  }

  const isEmailInvitation = notification.data.email !== undefined
  const isProjectInvitation = notification.data.changeType === "invited"
  const canShowActions = notification.data.projectId && notification.data.projectName

  if (compact) {
    return (
      <div
        className={`cursor-pointer ${!notification.read ? 'bg-muted/50' : ''} hover:bg-muted/30 transition-colors p-3`}
        onClick={handleMarkAsRead}
      >
        <div className="flex gap-3 w-full">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <UserPlus className="h-4 w-4" />
          </div>
          
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight">
                {notification.title}
              </p>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Invitado por {notification.data.invitedByName || 'Usuario desconocido'} al proyecto "{notification.data.projectName || 'Proyecto desconocido'}"
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true, 
                locale: es 
              })}
            </p>
            
            {isProjectInvitation && !hasResponded && canShowActions && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAccept()
                  }}
                  disabled={isProcessing}
                  className="h-7 px-3 text-xs"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDecline()
                  }}
                  disabled={isProcessing}
                  className="h-7 px-3 text-xs"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  Rechazar
                </Button>
              </div>
            )}
            
            {hasResponded && (
              <Badge variant="outline" className="w-fit text-xs mt-1">
                Respondido
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Vista expandida para página de notificaciones
  return (
    <div className={`rounded-lg border p-4 ${!notification.read ? 'bg-muted/20' : 'bg-background'}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <UserPlus className="h-6 w-6" />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">{notification.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.data.invitedByName} te ha invitado a unirte al proyecto
              </p>
            </div>
            {!notification.read && (
              <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          
            <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium text-sm">Proyecto: {notification.data.projectName || 'Proyecto desconocido'}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Invitado por {notification.data.invitedByName || 'Usuario desconocido'}
            </p>
            {isEmailInvitation && notification.data.email && (
              <p className="text-xs text-muted-foreground">
                Enviado a: {notification.data.email}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true, 
                locale: es 
              })}
            </p>
            
            {isProjectInvitation && !hasResponded && canShowActions ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Aceptar Invitación
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={isProcessing}
                  size="sm"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Rechazar
                </Button>
              </div>
            ) : hasResponded ? (
              <Badge variant="outline">Respondido</Badge>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
              >
                Marcar como leída
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}