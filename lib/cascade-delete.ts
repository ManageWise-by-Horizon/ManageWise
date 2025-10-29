/**
 * Utilidad para manejar eliminación en cascada de proyectos
 * Compatible con json-server actual y futuros microservicios
 */

interface CascadeDeleteOptions {
  projectId: string;
  apiUrl: string;
  currentUserId?: string; // Usuario que está eliminando el proyecto
  onProgress?: (entity: string, count: number) => void;
  onError?: (entity: string, error: any) => void;
}

interface CascadeDeleteResult {
  success: boolean;
  deletedEntities: {
    backlogs: number;
    userStories: number;
    tasks: number;
    sprints: number;
    meetings: number;
    okrs: number;
    invitations: number;
    notifications: number;
  };
  notifiedMembers: number;
  errors: Array<{
    entity: string;
    error: any;
  }>;
}

/**
 * Elimina todas las entidades relacionadas a un proyecto de forma cascada
 */
export async function cascadeDeleteProject({
  projectId,
  apiUrl,
  currentUserId,
  onProgress,
  onError
}: CascadeDeleteOptions): Promise<CascadeDeleteResult> {
  const result: CascadeDeleteResult = {
    success: true,
    deletedEntities: {
      backlogs: 0,
      userStories: 0,
      tasks: 0,
      sprints: 0,
      meetings: 0,
      okrs: 0,
      invitations: 0,
      notifications: 0
    },
    notifiedMembers: 0,
    errors: []
  };

  try {
    // Primero obtener información del proyecto y crear notificaciones para los miembros
    try {
      const projectResponse = await fetch(`${apiUrl}/projects/${projectId}`);
      if (projectResponse.ok) {
        const project = await projectResponse.json();
        
        // Crear notificaciones para todos los miembros (excepto el que eliminó)
        for (const memberId of project.members || []) {
          if (memberId !== currentUserId) {
            try {
              const notification = {
                id: `notif_project_deleted_${Date.now()}_${memberId}`,
                userId: memberId,
                projectId: projectId,
                type: 'project_deleted',
                title: 'Proyecto eliminado',
                message: `El proyecto "${project.name}" ha sido eliminado`,
                data: {
                  projectId: projectId,
                  projectName: project.name,
                  deletedBy: currentUserId || 'unknown',
                  deletedAt: new Date().toISOString(),
                  changeType: 'deleted'
                },
                read: false,
                createdAt: new Date().toISOString(),
                deliveryStatus: 'delivered'
              };

              const notifResponse = await fetch(`${apiUrl}/notifications`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(notification),
              });

              if (notifResponse.ok) {
                result.notifiedMembers++;
                console.log(`✅ Notificación creada para usuario ${memberId}`);
              }
            } catch (error) {
              console.error(`Error creando notificación para usuario ${memberId}:`, error);
              onError?.('notification', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo información del proyecto:', error);
      // Continuar con la eliminación aunque falle la notificación
    }
    // 1. Eliminar backlogs relacionados
    await deleteRelatedEntities({
      entity: 'backlogs',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 2. Eliminar user stories relacionadas
    await deleteRelatedEntities({
      entity: 'userStories',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 3. Eliminar tasks relacionadas
    await deleteRelatedEntities({
      entity: 'tasks',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 4. Eliminar sprints relacionados
    await deleteRelatedEntities({
      entity: 'sprints',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 5. Eliminar meetings relacionadas
    await deleteRelatedEntities({
      entity: 'meetings',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 6. Eliminar OKRs relacionados
    await deleteRelatedEntities({
      entity: 'okrs',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 7. Eliminar invitaciones relacionadas
    await deleteRelatedEntities({
      entity: 'invitations',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 8. Eliminar notificaciones relacionadas al proyecto
    await deleteRelatedEntities({
      entity: 'notifications',
      projectId,
      apiUrl,
      result,
      onProgress,
      onError
    });

    // 9. Finalmente eliminar el proyecto
    try {
      const response = await fetch(`${apiUrl}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error eliminando proyecto: ${response.status}`);
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        entity: 'project',
        error
      });
      onError?.('project', error);
    }

  } catch (error) {
    result.success = false;
    console.error('Error durante eliminación en cascada:', error);
  }

  return result;
}

/**
 * Elimina entidades relacionadas de un tipo específico
 */
async function deleteRelatedEntities({
  entity,
  projectId,
  apiUrl,
  result,
  onProgress,
  onError
}: {
  entity: keyof CascadeDeleteResult['deletedEntities'];
  projectId: string;
  apiUrl: string;
  result: CascadeDeleteResult;
  onProgress?: (entity: string, count: number) => void;
  onError?: (entity: string, error: any) => void;
}) {
  try {
    // Obtener todas las entidades de este tipo
    const response = await fetch(`${apiUrl}/${entity}`);
    if (!response.ok) {
      throw new Error(`Error fetching ${entity}: ${response.status}`);
    }

    const entities = await response.json();
    
    // Filtrar entidades que pertenecen al proyecto
    const relatedEntities = entities.filter((item: any) => 
      item.projectId === projectId
    );

    // Eliminar cada entidad relacionada
    for (const item of relatedEntities) {
      try {
        const deleteResponse = await fetch(`${apiUrl}/${entity}/${item.id}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          result.deletedEntities[entity]++;
        } else {
          throw new Error(`Error deleting ${entity} ${item.id}: ${deleteResponse.status}`);
        }
      } catch (error) {
        result.success = false;
        result.errors.push({
          entity: `${entity}[${item.id}]`,
          error
        });
        onError?.(entity, error);
      }
    }

    onProgress?.(entity, result.deletedEntities[entity]);

  } catch (error) {
    result.success = false;
    result.errors.push({
      entity,
      error
    });
    onError?.(entity, error);
  }
}

/**
 * Función de utilidad para limpiar datos huérfanos (sin projectId válido)
 * Útil para mantener la base de datos limpia
 */
export async function cleanupOrphanedData(apiUrl: string): Promise<{
  success: boolean;
  cleaned: {
    backlogs: number;
    userStories: number;
    tasks: number;
    sprints: number;
    meetings: number;
    okrs: number;
    invitations: number;
    notifications: number;
  };
  errors: Array<{
    entity?: string;
    itemId?: any;
    general?: unknown;
    error?: unknown;
  }>;
}> {
  const result = {
    success: true,
    cleaned: {
      backlogs: 0,
      userStories: 0,
      tasks: 0,
      sprints: 0,
      meetings: 0,
      okrs: 0,
      invitations: 0,
      notifications: 0
    },
    errors: [] as Array<{
      entity?: string;
      itemId?: any;
      general?: unknown;
      error?: unknown;
    }>
  };

  try {
    // Primero obtener todos los proyectos existentes
    const projectsResponse = await fetch(`${apiUrl}/projects`);
    const projects = await projectsResponse.json();
    const validProjectIds = new Set(projects.map((p: any) => p.id));

    // Limpiar cada tipo de entidad
    const entities = ['backlogs', 'userStories', 'tasks', 'sprints', 'meetings', 'okrs', 'invitations', 'notifications'] as const;
    
    for (const entityType of entities) {
      try {
        const response = await fetch(`${apiUrl}/${entityType}`);
        const items = await response.json();
        
        // Encontrar elementos huérfanos
        const orphanedItems = items.filter((item: any) => 
          item.projectId === null || !validProjectIds.has(item.projectId)
        );

        // Eliminar elementos huérfanos
        for (const item of orphanedItems) {
          try {
            const deleteResponse = await fetch(`${apiUrl}/${entityType}/${item.id}`, {
              method: 'DELETE',
            });

            if (deleteResponse.ok) {
              result.cleaned[entityType]++;
            }
          } catch (error) {
            result.errors.push({ entity: entityType, itemId: item.id, error });
          }
        }
      } catch (error) {
        result.success = false;
        result.errors.push({ entity: entityType, error });
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push({ general: error });
  }

  return result;
}