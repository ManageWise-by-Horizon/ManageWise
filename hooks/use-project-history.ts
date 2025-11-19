'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  History, 
  ChangeType, 
  EntityType, 
  HistoryFilters, 
  HistoryContext,
  CreateHistoryCommand 
} from '@/lib/domain/history/types/history.types';
import { historyService } from '@/lib/domain/history/services/history.service';
import { 
  CreateNotificationRequest, 
  NotificationType 
} from '@/lib/types/notifications';

interface UseProjectHistoryReturn {
  history: History[];
  loading: boolean;
  error: string | null;
  logChange: (
    changeType: ChangeType,
    entityType: EntityType,
    entityId: string,
    description: string,
    details: Record<string, any>,
    context: HistoryContext
  ) => Promise<void>;
  getHistory: (filters?: HistoryFilters) => Promise<void>;
  retryLastOperation: () => Promise<void>;
}

export function useProjectHistory(): UseProjectHistoryReturn {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<(() => Promise<void>) | null>(null);

  const generateId = () => {
    return 'hist_' + Math.random().toString(36).substr(2, 9);
  };

  // Función para crear notificaciones automáticamente basadas en cambios
  const createNotificationFromChange = async (
    changeType: ChangeType,
    entityType: EntityType,
    entityId: string,
    description: string,
    details: Record<string, any>,
    context: HistoryContext
  ) => {
    try {
      // Determinar el tipo de notificación y los usuarios a notificar
      let notificationType: NotificationType;
      let notificationTitle: string;
      let notificationMessage: string;
      let usersToNotify: string[] = [];

      // Mapear cambios a tipos de notificación
      switch (entityType) {
        case 'task':
          if (changeType === 'task_created') {
            notificationType = 'task_created';
            notificationTitle = 'Nueva tarea creada';
            notificationMessage = `Se creó la tarea "${details.title || details.name || entityId}"`;
          } else if (changeType === 'task_updated') {
            notificationType = 'task_updated';
            notificationTitle = 'Tarea actualizada';
            notificationMessage = `La tarea "${details.title || details.name || entityId}" ha sido actualizada`;
          } else if (changeType === 'task_status_changed') {
            notificationType = 'task_updated';
            notificationTitle = 'Estado de tarea cambiado';
            notificationMessage = `La tarea "${details.title || details.name || entityId}" cambió a ${details.newValue}`;
          } else if (changeType === 'task_assigned') {
            notificationType = 'task_assigned';
            notificationTitle = 'Tarea asignada';
            notificationMessage = `Te han asignado la tarea "${details.title || details.name || entityId}"`;
            // Solo notificar al usuario asignado
            if (details.assignedTo) {
              usersToNotify = [details.assignedTo];
            }
          } else {
            return; // No crear notificación para otros tipos
          }
          break;

        case 'userStory':
          if (changeType === 'user_story_created') {
            notificationType = 'task_created';
            notificationTitle = 'Nueva historia de usuario creada';
            notificationMessage = `Se creó la historia "${details.title || details.name || entityId}"`;
          } else if (changeType === 'user_story_updated') {
            notificationType = 'task_updated';
            notificationTitle = 'Historia de usuario actualizada';
            notificationMessage = `La historia "${details.title || details.name || entityId}" ha sido actualizada`;
          } else if (changeType === 'user_story_status_changed') {
            notificationType = 'task_updated';
            notificationTitle = 'Estado de historia cambiado';
            notificationMessage = `La historia "${details.title || details.name || entityId}" cambió a ${details.newValue}`;
          } else {
            return;
          }
          break;

        case 'project':
          notificationType = 'project_updated';
          notificationTitle = 'Proyecto actualizado';
          notificationMessage = `El proyecto ha sido actualizado: ${description}`;
          break;

        case 'sprint':
          if (changeType === 'sprint_created') {
            notificationType = 'sprint_created';
            notificationTitle = 'Nuevo sprint creado';
            notificationMessage = `Se creó el sprint "${details.name || entityId}"`;
          } else if (changeType === 'sprint_completed') {
            notificationType = 'sprint_completed';
            notificationTitle = 'Sprint completado';
            notificationMessage = `El sprint "${details.name || entityId}" ha sido completado`;
          } else {
            return;
          }
          break;

        default:
          return; // No crear notificación para otros tipos de entidad
      }

      // Si no se especificaron usuarios, obtener todos los miembros del proyecto
      if (usersToNotify.length === 0) {
        try {
          const membersResponse = await fetch(`${API_BASE}/projectMembers?projectId=${context.projectId}`);
          if (membersResponse.ok) {
            const members = await membersResponse.json();
            usersToNotify = members.map((member: any) => member.userId);
          }
        } catch (err) {
          console.error('Error fetching project members for notifications:', err);
          return;
        }
      }

      // Crear notificaciones para cada usuario
      const notificationPromises = usersToNotify.map(async (userId) => {
        // No notificar al usuario que hizo el cambio
        if (userId === context.userId) return;

        const notificationData: CreateNotificationRequest = {
          userId,
          projectId: context.projectId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          data: {
            taskId: entityType === 'userStory' || entityType === 'task' ? entityId : undefined,
            taskTitle: details.title || details.name,
            projectId: context.projectId,
            projectName: details.projectName,
            changeType: changeType as any,
            oldValue: details.oldValue,
            newValue: details.newValue,
            changedBy: context.userId,
            sprintId: entityType === 'sprint' ? entityId : undefined,
            sprintName: entityType === 'sprint' ? details.name : undefined
          }
        };

        const response = await fetch(`${API_BASE}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...notificationData,
            read: false,
            createdAt: new Date().toISOString(),
            readAt: null
          })
        });

        if (!response.ok) {
          throw new Error('Error al crear notificación');
        }
      });

      await Promise.all(notificationPromises);

    } catch (err) {
      console.error('Error creating notifications from change:', err);
      // No fallar el registro del historial por errores de notificación
    }
  };

  const logChange = useCallback(async (
    changeType: ChangeType,
    entityType: EntityType,
    entityId: string,
    description: string,
    details: Record<string, any>,
    context: HistoryContext
  ) => {
    const operation = async () => {
      try {
        // Crear comando para el servicio DDD
        const command: CreateHistoryCommand = {
          userId: context.userId,
          changeType: changeType as string,
          entityType: entityType as string,
          entityId,
          description,
          details,
          timestamp: new Date().toISOString(),
          userAgent: context.userAgent || 'ManageWise Web App',
          metadata: {
            source: context.source || 'manual',
            version: '1.0.0'
          }
        };

        // Usar el servicio DDD para crear el historial
        const historyEntry = await historyService.createHistory(context.projectId, command);

        // Crear notificaciones automáticamente después de registrar el cambio
        await createNotificationFromChange(
          changeType,
          entityType,
          entityId,
          description,
          details,
          context
        );

        // Actualizar el estado local
        setHistory(prev => [historyEntry, ...prev]);
        setError(null);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        
        // Auto-retry después de 2 segundos
        setTimeout(async () => {
          try {
            await operation();
            toast({
              title: "Cambio registrado",
              description: "El cambio se registró exitosamente después del reintento.",
            });
          } catch (retryErr) {
            toast({
              variant: "destructive",
              title: "Error al registrar cambio",
              description: "No se pudo registrar el cambio. Puedes intentarlo manualmente.",
            });
          }
        }, 2000);

        throw err;
      }
    };

    setLastOperation(() => operation);
    await operation();
  }, []);

  const getHistory = useCallback(async (filters?: HistoryFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Obtener projectId de los filtros o lanzar error
      const projectId = filters?.projectId;
      if (!projectId) {
        throw new Error('projectId es requerido para obtener el historial');
      }

      // Usar el servicio DDD para obtener el historial
      const data = await historyService.getHistoryByProjectId(projectId, filters);
      
      // Ordenar por fecha más reciente
      const sortedHistory = data.sort((a: History, b: History) => {
        const timestampA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : (a.timestamp as Date).getTime();
        const timestampB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : (b.timestamp as Date).getTime();
        return timestampB - timestampA;
      });

      setHistory(sortedHistory);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar historial';
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (lastOperation) {
      try {
        await lastOperation();
        toast({
          title: "Operación completada",
          description: "La operación se completó exitosamente.",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo completar la operación.",
        });
      }
    }
  }, [lastOperation]);

  return {
    history,
    loading,
    error,
    logChange,
    getHistory,
    retryLastOperation
  };
}

// Hook auxiliar para registrar cambios automáticamente
export function useAutoLogChange(context: HistoryContext) {
  const { logChange } = useProjectHistory();

  const logProjectChange = useCallback((
    changeType: ChangeType,
    entityType: EntityType,
    entityId: string,
    description: string,
    details: Record<string, any>
  ) => {
    logChange(changeType, entityType, entityId, description, details, context);
  }, [logChange, context]);

  return { logProjectChange };
}