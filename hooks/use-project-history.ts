'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  ProjectHistoryEntry, 
  ChangeType, 
  EntityType, 
  HistoryFilters, 
  HistoryContext 
} from '@/lib/types/project-history';

const API_BASE = 'http://localhost:3001';

interface UseProjectHistoryReturn {
  history: ProjectHistoryEntry[];
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
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<(() => Promise<void>) | null>(null);

  const generateId = () => {
    return 'hist_' + Math.random().toString(36).substr(2, 9);
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
        const historyEntry: ProjectHistoryEntry = {
          id: generateId(),
          projectId: context.projectId,
          userId: context.userId,
          changeType,
          entityType,
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

        const response = await fetch(`${API_BASE}/projectHistory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(historyEntry),
        });

        if (!response.ok) {
          throw new Error(`Error al registrar cambio: ${response.status}`);
        }

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
      let url = `${API_BASE}/projectHistory`;
      const params = new URLSearchParams();

      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.changeType) params.append('changeType', filters.changeType);
      if (filters?.entityType) params.append('entityType', filters.entityType);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener historial: ${response.status}`);
      }

      const data = await response.json();
      
      // Ordenar por fecha más reciente
      const sortedHistory = data.sort((a: ProjectHistoryEntry, b: ProjectHistoryEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

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