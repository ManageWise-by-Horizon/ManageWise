import { getApiClient } from '@/lib/infrastructure/api/api-client';
import type { Task, CreateTaskCommand, UpdateTaskCommand } from '../types/task.types';

export class TaskService {
  private api = getApiClient();

  async createTask(command: CreateTaskCommand): Promise<Task> {
    // Validar que assignedTo esté presente
    if (!command.assignedTo || command.assignedTo.trim() === '') {
      throw new Error('assignedTo es obligatorio para crear una tarea')
    }

    const payload = {
      userStoryId: command.userStoryId,
      assignedTo: command.assignedTo, // Ahora es obligatorio
      createdBy: command.createdBy,
      title: command.title,
      description: command.description,
      estimatedHours: command.estimatedHours,
      status: command.status || 'TODO',
      priority: command.priority,
      aiGenerated: command.aiGenerated || false,
    };

    console.log('[TaskService] Creating task with payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await this.api.post<Task>('/api/v1/tasks', payload);
      console.log('[TaskService] Task created successfully:', result);
      return result;
    } catch (error) {
      console.error('[TaskService] Error creating task:', error);
      console.error('[TaskService] Payload that failed:', JSON.stringify(payload, null, 2));
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task> {
    return this.api.get<Task>(`/api/v1/tasks/${id}`);
  }

  async getTasksByUserStoryId(userStoryId: string): Promise<Task[]> {
    console.log(`[TaskService] Getting tasks for userStoryId: ${userStoryId}`);
    const result = await this.api.get<Task[]>(`/api/v1/tasks/user-story/${userStoryId}`);
    console.log(`[TaskService] Received ${Array.isArray(result) ? result.length : 0} tasks`);
    return Array.isArray(result) ? result : [];
  }

  async getAllTasks(): Promise<Task[]> {
    console.log('[TaskService] Getting all tasks');
    const result = await this.api.get<Task[]>(`/api/v1/tasks`);
    console.log(`[TaskService] Received ${Array.isArray(result) ? result.length : 0} tasks`);
    return Array.isArray(result) ? result : [];
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    console.log(`[TaskService] Getting tasks for userId: ${userId}`);
    const allTasks = await this.getAllTasks();
    // Filtrar tareas asignadas al usuario
    const userTasks = allTasks.filter(task => task.assignedTo === userId);
    console.log(`[TaskService] Found ${userTasks.length} tasks for user ${userId}`);
    return userTasks;
  }

  async updateTask(id: string, command: UpdateTaskCommand): Promise<Task> {
    // The backend UpdateTaskResource requires id, title, description, estimatedHours, status, priority, assignedTo
    // All fields are required, so we must provide them all
    
    if (!command.title) {
      throw new Error('Title is required to update a task');
    }
    if (!command.description) {
      throw new Error('Description is required to update a task');
    }
    if (command.estimatedHours === undefined || command.estimatedHours === null) {
      throw new Error('EstimatedHours is required to update a task');
    }
    if (!command.status) {
      throw new Error('Status is required to update a task');
    }
    if (!command.priority) {
      throw new Error('Priority is required to update a task');
    }

    // The UpdateTaskResource requires id, but the backend uses the id from the path parameter
    // However, the resource still expects it, so we include it
    const payload: any = {
      id: id, // Backend UpdateTaskResource expects id in the resource (even though it uses path param)
      title: String(command.title).trim(), // Ensure it's a non-empty string
      description: String(command.description).trim(), // Ensure it's a non-empty string
      estimatedHours: Number(command.estimatedHours), // Ensure it's a number
      status: String(command.status), // Ensure it's a string
      priority: String(command.priority), // Ensure it's a string
      assignedTo: (command.assignedTo !== undefined && command.assignedTo !== null && command.assignedTo !== '') 
        ? String(command.assignedTo) 
        : null, // Can be null, but if present must be string
    };

    console.log('[TaskService] Updating task with payload:', JSON.stringify(payload, null, 2));
    console.log('[TaskService] Updating task ID:', id);

    try {
      const result = await this.api.put<Task>(`/api/v1/tasks/${id}`, payload);
      console.log('[TaskService] Task updated successfully:', result);
      return result;
    } catch (error) {
      console.error('[TaskService] Error updating task:', error);
      console.error('[TaskService] Payload that failed:', JSON.stringify(payload, null, 2));
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`/api/v1/tasks/${id}`);
  }
}

export const taskService = new TaskService();

