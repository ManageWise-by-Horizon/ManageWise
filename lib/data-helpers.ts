/**
 * Data Helpers - Funciones para enriquecer datos con JOINs
 * 
 * Este módulo proporciona funciones para obtener datos relacionados
 * sin usar campos desnormalizados, siguiendo las mejores prácticas
 * de normalización de bases de datos.
 */

import { API_BASE_URL } from './api-config';

const API_BASE = API_BASE_URL;

// ==================== TIPOS ====================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface UserStory {
  id: string;
  title: string;
  projectId: string;
  [key: string]: any;
}

interface Task {
  id: string;
  title: string;
  userStoryId: string;
  projectId?: string; // Será eliminado - campo redundante
  [key: string]: any;
}

interface Notification {
  id: string;
  data?: {
    invitedBy?: string;
    changedBy?: string;
    acceptedBy?: string;
    declinedBy?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Invitation {
  id: string;
  invitedBy: string;
  [key: string]: any;
}

interface EnrichedTask extends Task {
  projectId: string; // Obtenido via JOIN
  projectName?: string;
}

interface EnrichedNotification extends Notification {
  invitedByName?: string;
  changedByName?: string;
  acceptedByName?: string;
  declinedByName?: string;
}

interface EnrichedInvitation extends Invitation {
  invitedByName: string;
}

// ==================== FUNCIONES DE ENRIQUECIMIENTO ====================

/**
 * Enriquece notificaciones con nombres de usuario
 * JOIN: notifications → users
 */
export async function enrichNotifications(
  notifications: Notification[]
): Promise<EnrichedNotification[]> {
  if (notifications.length === 0) return [];

  try {
    // Obtener todos los usuarios
    const usersRes = await fetch(`${API_BASE}/users`);
    if (!usersRes.ok) throw new Error('Error al obtener usuarios');
    const users: User[] = await usersRes.json();

    // Crear mapa de usuarios para búsqueda rápida
    const userMap = new Map(users.map(user => [user.id, user]));

    // Enriquecer notificaciones
    return notifications.map(notification => {
      const enriched: EnrichedNotification = { ...notification };

      if (notification.data) {
        // Agregar nombres de usuario según los IDs disponibles
        if (notification.data.invitedBy) {
          const user = userMap.get(notification.data.invitedBy);
          enriched.invitedByName = user?.name || 'Usuario desconocido';
        }

        if (notification.data.changedBy) {
          const user = userMap.get(notification.data.changedBy);
          enriched.changedByName = user?.name || 'Usuario desconocido';
        }

        if (notification.data.acceptedBy) {
          const user = userMap.get(notification.data.acceptedBy);
          enriched.acceptedByName = user?.name || 'Usuario desconocido';
        }

        if (notification.data.declinedBy) {
          const user = userMap.get(notification.data.declinedBy);
          enriched.declinedByName = user?.name || 'Usuario desconocido';
        }
      }

      return enriched;
    });
  } catch (error) {
    console.error('[data-helpers] Error enriching notifications:', error);
    return notifications as EnrichedNotification[];
  }
}

/**
 * Enriquece invitaciones con nombres de usuario
 * JOIN: invitations → users
 */
export async function enrichInvitations(
  invitations: Invitation[]
): Promise<EnrichedInvitation[]> {
  if (invitations.length === 0) return [];

  try {
    // Obtener todos los usuarios
    const usersRes = await fetch(`${API_BASE}/users`);
    if (!usersRes.ok) throw new Error('Error al obtener usuarios');
    const users: User[] = await usersRes.json();

    // Crear mapa de usuarios para búsqueda rápida
    const userMap = new Map(users.map(user => [user.id, user]));

    // Enriquecer invitaciones
    return invitations.map(invitation => ({
      ...invitation,
      invitedByName: userMap.get(invitation.invitedBy)?.name || 'Usuario desconocido'
    }));
  } catch (error) {
    console.error('[data-helpers] Error enriching invitations:', error);
    return invitations.map(inv => ({
      ...inv,
      invitedByName: 'Usuario desconocido'
    }));
  }
}

/**
 * Enriquece tasks con projectId obtenido via userStories
 * JOIN: tasks → userStories → projects
 * 
 * Esta función elimina la necesidad del campo projectId redundante en tasks.
 * El projectId se obtiene navegando: task.userStoryId → userStory.projectId
 */
export async function enrichTasks(
  tasks: Task[]
): Promise<EnrichedTask[]> {
  if (tasks.length === 0) return [];

  try {
    // Obtener IDs únicos de userStories
    const userStoryIds = [...new Set(tasks.map(task => task.userStoryId))];

    // Obtener todas las userStories necesarias
    const userStoriesPromises = userStoryIds.map(id =>
      fetch(`${API_BASE}/userStories/${id}`).then(res => res.ok ? res.json() : null)
    );
    
    const userStories = (await Promise.all(userStoriesPromises)).filter(Boolean) as UserStory[];

    // Crear mapa de userStories para búsqueda rápida
    const userStoryMap = new Map(userStories.map(story => [story.id, story]));

    // Obtener projectIds únicos
    const projectIds = [...new Set(userStories.map(story => story.projectId))];

    // Obtener todos los proyectos necesarios
    const projectsPromises = projectIds.map(id =>
      fetch(`${API_BASE}/projects/${id}`).then(res => res.ok ? res.json() : null)
    );

    const projects = (await Promise.all(projectsPromises)).filter(Boolean);

    // Crear mapa de proyectos para búsqueda rápida
    const projectMap = new Map(projects.map(project => [project.id, project]));

    // Enriquecer tasks con projectId y projectName
    return tasks.map(task => {
      const userStory = userStoryMap.get(task.userStoryId);
      const project = userStory ? projectMap.get(userStory.projectId) : null;

      return {
        ...task,
        projectId: project?.id || task.projectId || '', // Fallback si no se encuentra
        projectName: project?.name
      };
    });
  } catch (error) {
    console.error('[data-helpers] Error enriching tasks:', error);
    // Retornar tasks con projectId original si existe
    return tasks.map(task => ({
      ...task,
      projectId: task.projectId || ''
    }));
  }
}

/**
 * Obtiene el projectId de una task específica
 * JOIN: task → userStory → project
 */
export async function getProjectIdFromTask(taskId: string): Promise<string | null> {
  try {
    // Obtener la task
    const taskRes = await fetch(`${API_BASE}/tasks/${taskId}`);
    if (!taskRes.ok) return null;
    const task: Task = await taskRes.json();

    // Obtener la userStory
    const userStoryRes = await fetch(`${API_BASE}/userStories/${task.userStoryId}`);
    if (!userStoryRes.ok) return null;
    const userStory: UserStory = await userStoryRes.json();

    return userStory.projectId;
  } catch (error) {
    console.error('[data-helpers] Error getting projectId from task:', error);
    return null;
  }
}

/**
 * Obtiene múltiples projectIds para un array de taskIds
 * Más eficiente que llamar getProjectIdFromTask() múltiples veces
 */
export async function getProjectIdsFromTasks(taskIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  if (taskIds.length === 0) return result;

  try {
    // Obtener todas las tasks
    const tasksPromises = taskIds.map(id =>
      fetch(`${API_BASE}/tasks/${id}`).then(res => res.ok ? res.json() : null)
    );
    const tasks = (await Promise.all(tasksPromises)).filter(Boolean) as Task[];

    // Obtener userStoryIds únicos
    const userStoryIds = [...new Set(tasks.map(task => task.userStoryId))];

    // Obtener todas las userStories
    const userStoriesPromises = userStoryIds.map(id =>
      fetch(`${API_BASE}/userStories/${id}`).then(res => res.ok ? res.json() : null)
    );
    const userStories = (await Promise.all(userStoriesPromises)).filter(Boolean) as UserStory[];

    // Crear mapa de userStories
    const userStoryMap = new Map(userStories.map(story => [story.id, story]));

    // Mapear taskId → projectId
    tasks.forEach(task => {
      const userStory = userStoryMap.get(task.userStoryId);
      if (userStory) {
        result.set(task.id, userStory.projectId);
      }
    });

    return result;
  } catch (error) {
    console.error('[data-helpers] Error getting projectIds from tasks:', error);
    return result;
  }
}

// ==================== EXPORTACIONES ====================

export type {
  EnrichedTask,
  EnrichedNotification,
  EnrichedInvitation,
  Task,
  UserStory,
  User,
  Notification,
  Invitation
};
