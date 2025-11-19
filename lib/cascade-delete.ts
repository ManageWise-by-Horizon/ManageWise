/**
 * Utilidad para manejar eliminación en cascada de proyectos
 * Compatible con json-server actual y futuros microservicios
 */

"use client"

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
      const projectResponse = await fetch(`${apiUrl}/api/v1/projects/${projectId}`);
      if (projectResponse.ok) {
        // Leer la respuesta como texto primero para evitar errores de JSON
        const text = await projectResponse.text();
        const contentType = projectResponse.headers.get('content-type');
        
        let project: any = null;
        if (text && text.trim() !== '') {
          if (contentType?.includes('application/json')) {
            try {
              project = JSON.parse(text);
            } catch (parseError) {
              console.warn('Error parsing project JSON:', parseError);
              // Continuar sin notificaciones si no se puede parsear
            }
          }
        }
        
        if (project) {
          // Crear notificaciones para todos los miembros (excepto el que eliminó)
          for (const memberId of project.members || []) {
            if (memberId !== currentUserId) {
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

              try {
                const notifResponse = await fetch(`${apiUrl}/api/v1/notifications`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(notification),
                });

                if (notifResponse.ok) {
                  result.notifiedMembers++;
                  console.log(`✅ Notificación creada para usuario ${memberId}`);
                } else {
                  // Leer el error como texto para evitar errores de JSON
                  try {
                    const errorText = await notifResponse.text();
                    console.warn(`Error creating notification: ${notifResponse.status} - ${errorText.substring(0, 100)}`);
                  } catch (readError) {
                    console.warn(`Error creating notification: ${notifResponse.status}`);
                  }
                }
              } catch (notifError) {
                console.warn(`Error creating notification for user ${memberId}:`, notifError);
              }
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

    // 9. Finalmente eliminar el proyecto (esto se hace en el componente usando projectService)
    // No eliminamos aquí porque el componente ya lo hace usando el servicio DDD
    // que maneja correctamente los errores

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
    // Mapear nombres de entidades a endpoints de la API
    const entityEndpoints: Record<string, string> = {
      backlogs: `/api/v1/backlogs`, // Puede no existir
      userStories: `/api/v1/user-stories/project/${projectId}`,
      tasks: `/api/v1/tasks`, // Puede no existir
      sprints: `/api/v1/sprints`, // Puede no existir
      meetings: `/api/v1/meetings`, // Puede no existir
      okrs: `/api/v1/okrs/projects/${projectId}`,
      invitations: `/api/v1/invitations/projects/${projectId}`,
      notifications: `/api/v1/notifications` // Puede no tener endpoint por proyecto
    };

    const endpoint = entityEndpoints[entity];
    if (!endpoint) {
      console.warn(`No endpoint defined for entity: ${entity}`);
      return;
    }

    // Obtener todas las entidades de este tipo
    const response = await fetch(`${apiUrl}${endpoint}`);
    
    // Si el endpoint no existe (404), simplemente continuar sin error
    if (response.status === 404) {
      console.log(`Endpoint ${endpoint} not found (404), skipping ${entity} deletion`);
      return;
    }

    if (!response.ok) {
      // Si es un error diferente a 404, leer el mensaje como texto y registrar pero continuar
      try {
        const text = await response.text();
        console.warn(`Error fetching ${entity}: ${response.status} - ${text.substring(0, 100)}`);
      } catch (readError) {
        console.warn(`Error fetching ${entity}: ${response.status}`);
      }
      return;
    }

    // Leer la respuesta como texto primero para evitar errores de JSON
    const text = await response.text();
    const contentType = response.headers.get('content-type');
    
    let entities: any[] = [];
    if (text && text.trim() !== '') {
      if (contentType?.includes('application/json')) {
        try {
          entities = JSON.parse(text);
        } catch (parseError) {
          console.warn(`Error parsing JSON response for ${entity}:`, parseError);
          return; // Si no se puede parsear, salir sin error
        }
      } else {
        // Si no es JSON, asumir que no hay entidades
        console.log(`Response for ${entity} is not JSON, skipping`);
        return;
      }
    }
    
    const entitiesArray = Array.isArray(entities) ? entities : [];
    
    // Filtrar entidades que pertenecen al proyecto
    const relatedEntities = entitiesArray.filter((item: any) => {
      // Algunos endpoints ya filtran por proyecto, así que verificar
      if (endpoint.includes(`/project/${projectId}`)) {
        return true; // Ya filtrado por el backend
      }
      return item.projectId === projectId || item.projectId?.toString() === projectId.toString();
    });

    // Eliminar cada entidad relacionada
    for (const item of relatedEntities) {
      try {
        // Construir el endpoint de eliminación según el tipo de entidad
        let deleteEndpoint = '';
        if (entity === 'userStories') {
          deleteEndpoint = `/api/v1/user-stories/${item.id}`;
        } else if (entity === 'okrs') {
          deleteEndpoint = `/api/v1/okrs/${item.id}`;
        } else if (entity === 'invitations') {
          deleteEndpoint = `/api/v1/invitations/${item.id}`;
        } else if (entity === 'notifications') {
          deleteEndpoint = `/api/v1/notifications/${item.id}`;
        } else {
          // Para otras entidades, usar formato genérico
          deleteEndpoint = `${endpoint}/${item.id}`;
        }

        const deleteResponse = await fetch(`${apiUrl}${deleteEndpoint}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          result.deletedEntities[entity]++;
        } else if (deleteResponse.status === 404) {
          // Si la entidad ya no existe, continuar sin error
          console.log(`${entity} ${item.id} already deleted or not found`);
        } else {
          // Leer el cuerpo como texto para evitar errores de JSON
          try {
            const text = await deleteResponse.text();
            console.warn(`Error deleting ${entity} ${item.id}: ${deleteResponse.status} - ${text.substring(0, 100)}`);
          } catch (readError) {
            console.warn(`Error deleting ${entity} ${item.id}: ${deleteResponse.status}`);
          }
        }
      } catch (error) {
        // Registrar error pero continuar con otras entidades
        console.warn(`Error deleting ${entity} ${item.id}:`, error);
        result.errors.push({
          entity: `${entity}[${item.id}]`,
          error
        });
        onError?.(entity, error);
      }
    }

    onProgress?.(entity, result.deletedEntities[entity]);

  } catch (error) {
    // No marcar como error fatal, solo registrar
    console.warn(`Error processing ${entity}:`, error);
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