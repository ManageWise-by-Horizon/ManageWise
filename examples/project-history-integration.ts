// Ejemplo de integración del sistema de historial
// Este archivo muestra cómo integrar el registro automático en los hooks existentes

/*
// En hooks/use-projects.ts (o cualquier hook que modifique datos)
import { useAutoLogChange } from '@/hooks/use-project-history';

export function useProjects() {
  const { user } = useAuth();
  const { logProjectChange } = useAutoLogChange({
    userId: user?.id || '',
    projectId: '', // Se establecerá dinámicamente
    source: 'manual'
  });

  const createProject = async (projectData: any) => {
    try {
      // Crear el proyecto
      const response = await fetch('http://localhost:3001/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      const newProject = await response.json();
      
      // Registrar automáticamente el cambio
      await logProjectChange(
        'project_created',
        'project',
        newProject.id,
        `Proyecto creado: ${newProject.name}`,
        {
          projectName: newProject.name,
          description: newProject.description,
          timeline: newProject.timeline
        }
      );
      
      return newProject;
    } catch (error) {
      // El hook maneja automáticamente los reintentos en caso de error
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: any) => {
    try {
      const response = await fetch(`http://localhost:3001/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const updatedProject = await response.json();
      
      // Registrar el cambio con detalles específicos
      await logProjectChange(
        'project_updated',
        'project',
        projectId,
        `Proyecto actualizado: ${updatedProject.name}`,
        {
          changes: updates,
          projectName: updatedProject.name
        }
      );
      
      return updatedProject;
    } catch (error) {
      throw error;
    }
  };

  return { createProject, updateProject };
}

// En hooks/use-tasks.ts
export function useTasks(projectId: string) {
  const { user } = useAuth();
  const { logProjectChange } = useAutoLogChange({
    userId: user?.id || '',
    projectId,
    source: 'manual'
  });

  const createTask = async (taskData: any) => {
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, projectId })
      });
      
      const newTask = await response.json();
      
      // Log automático del cambio
      await logProjectChange(
        'task_created',
        'task',
        newTask.id,
        `Tarea creada: ${newTask.title}`,
        {
          title: newTask.title,
          assignedTo: newTask.assignedTo,
          priority: newTask.priority,
          userStoryId: newTask.userStoryId
        }
      );
      
      return newTask;
    } catch (error) {
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const updatedTask = await response.json();
      
      await logProjectChange(
        'task_status_changed',
        'task',
        taskId,
        `Estado de tarea cambiado: ${updatedTask.title} → ${newStatus}`,
        {
          title: updatedTask.title,
          oldStatus: updatedTask.previousStatus,
          newStatus: newStatus
        }
      );
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  };

  const assignTask = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId })
      });
      
      const updatedTask = await response.json();
      
      await logProjectChange(
        'task_assigned',
        'task',
        taskId,
        `Tarea asignada: ${updatedTask.title}`,
        {
          title: updatedTask.title,
          assignedTo: userId,
          assignedBy: user?.id
        }
      );
      
      return updatedTask;
    } catch (error) {
      throw error;
    }
  };

  return { createTask, updateTaskStatus, assignTask };
}

// En hooks/use-user-stories.ts
export function useUserStories(projectId: string) {
  const { user } = useAuth();
  const { logProjectChange } = useAutoLogChange({
    userId: user?.id || '',
    projectId,
    source: 'manual'
  });

  const createUserStory = async (storyData: any) => {
    try {
      const response = await fetch('http://localhost:3001/userStories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...storyData, projectId })
      });
      
      const newStory = await response.json();
      
      await logProjectChange(
        'user_story_created',
        'userStory',
        newStory.id,
        `Historia de usuario creada: ${newStory.title}`,
        {
          title: newStory.title,
          priority: newStory.priority,
          storyPoints: newStory.storyPoints,
          aiGenerated: newStory.aiGenerated
        }
      );
      
      return newStory;
    } catch (error) {
      throw error;
    }
  };

  return { createUserStory };
}

// En hooks/use-okrs.ts
export function useOKRs(projectId: string) {
  const { user } = useAuth();
  const { logProjectChange } = useAutoLogChange({
    userId: user?.id || '',
    projectId,
    source: 'manual'
  });

  const createObjective = async (objectiveData: any) => {
    try {
      const response = await fetch('http://localhost:3001/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...objectiveData, projectId })
      });
      
      const newObjective = await response.json();
      
      await logProjectChange(
        'objective_created',
        'objective',
        newObjective.id,
        `Objetivo creado: ${newObjective.title}`,
        {
          title: newObjective.title,
          description: newObjective.description
        }
      );
      
      return newObjective;
    } catch (error) {
      throw error;
    }
  };

  const updateKeyResultProgress = async (keyResultId: string, progress: number) => {
    try {
      const response = await fetch(`http://localhost:3001/keyResults/${keyResultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentValue: progress })
      });
      
      const updatedKR = await response.json();
      
      await logProjectChange(
        'key_result_progress_updated',
        'keyResult',
        keyResultId,
        `Progreso actualizado: ${updatedKR.title}`,
        {
          title: updatedKR.title,
          currentValue: progress,
          targetValue: updatedKR.targetValue,
          progressPercentage: (progress / updatedKR.targetValue) * 100
        }
      );
      
      return updatedKR;
    } catch (error) {
      throw error;
    }
  };

  return { createObjective, updateKeyResultProgress };
}
*/

export {};