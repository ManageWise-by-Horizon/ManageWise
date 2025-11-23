'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useProjectHistory } from '@/hooks/use-project-history';
import { History, ChangeType, EntityType } from '@/lib/domain/history/types/history.types';
import { profileService } from '@/lib/domain/profile/services/profile.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/projects/permission-guard';
import { 
  Clock, 
  User, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  FolderOpen,
  FileText,
  CheckSquare,
  Target,
  MessageSquare,
  UserPlus,
  Calendar,
  Video
} from 'lucide-react';

interface ProjectHistoryDashboardProps {
  projectId: string;
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  'project_created': 'Proyecto creado',
  'project_updated': 'Proyecto actualizado',
  'project_deleted': 'Proyecto eliminado',
  'project_status_changed': 'Estado del proyecto cambiado',
  'user_story_created': 'Historia de usuario creada',
  'user_story_updated': 'Historia de usuario actualizada',
  'user_story_deleted': 'Historia de usuario eliminada',
  'user_story_status_changed': 'Estado de historia cambiado',
  'user_story_priority_changed': 'Prioridad de historia cambiada',
  'task_created': 'Tarea creada',
  'task_updated': 'Tarea actualizada',
  'task_deleted': 'Tarea eliminada',
  'task_status_changed': 'Estado de tarea cambiado',
  'task_assigned': 'Tarea asignada',
  'task_unassigned': 'Tarea desasignada',
  'sprint_created': 'Sprint creado',
  'sprint_updated': 'Sprint actualizado',
  'sprint_deleted': 'Sprint eliminado',
  'sprint_started': 'Sprint iniciado',
  'sprint_completed': 'Sprint completado',
  'objective_created': 'Objetivo creado',
  'objective_updated': 'Objetivo actualizado',
  'objective_deleted': 'Objetivo eliminado',
  'key_result_created': 'Resultado clave creado',
  'key_result_updated': 'Resultado clave actualizado',
  'key_result_deleted': 'Resultado clave eliminado',
  'key_result_progress_updated': 'Progreso actualizado',
  'comment_created': 'Comentario agregado',
  'comment_updated': 'Comentario actualizado',
  'comment_deleted': 'Comentario eliminado',
  'member_added': 'Miembro agregado',
  'member_removed': 'Miembro removido',
  'member_role_changed': 'Rol de miembro cambiado',
  'meeting_created': 'Reunión creada',
  'meeting_updated': 'Reunión actualizada',
  'meeting_deleted': 'Reunión eliminada'
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  'project': 'Proyecto',
  'userStory': 'Historia de Usuario',
  'user_story': 'Historia de Usuario',
  'task': 'Tarea',
  'sprint': 'Sprint',
  'objective': 'Objetivo',
  'okr': 'Objetivo',
  'keyResult': 'Resultado Clave',
  'key_result': 'Resultado Clave',
  'comment': 'Comentario',
  'member': 'Miembro',
  'meeting': 'Reunión',
  'invitation': 'Invitación',
  'permission': 'Permiso'
};

const CHANGE_TYPE_ICONS: Record<string, any> = {
  'project': FolderOpen,
  'userStory': FileText,
  'task': CheckSquare,
  'sprint': Calendar,
  'objective': Target,
  'keyResult': Target,
  'comment': MessageSquare,
  'member': UserPlus,
  'meeting': Video
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  'created': 'bg-green-500/10 text-green-700 border-green-200',
  'updated': 'bg-blue-500/10 text-blue-700 border-blue-200',
  'deleted': 'bg-red-500/10 text-red-700 border-red-200',
  'status_changed': 'bg-amber-500/10 text-amber-700 border-amber-200',
  'assigned': 'bg-purple-500/10 text-purple-700 border-purple-200',
  'default': 'bg-gray-500/10 text-gray-700 border-gray-200'
};

export function ProjectHistoryDashboard({ projectId }: ProjectHistoryDashboardProps) {
  const { user } = useAuth();
  const { history, loading, error, getHistory, retryLastOperation } = useProjectHistory();
  
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterChangeType, setFilterChangeType] = useState<ChangeType | 'all' | ''>('');
  const [filterEntityType, setFilterEntityType] = useState<EntityType | 'all' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (projectId && user) {
      getHistory({ projectId });
    }
  }, [projectId, user, getHistory]);

  // Cargar usuarios después de que el historial se haya cargado
  useEffect(() => {
    const loadUserProfiles = async () => {
      if (history && Array.isArray(history) && history.length > 0) {
        try {
          // Obtener todos los UUIDs únicos de usuarios del historial
          const uniqueUserIds = new Set<string>();
          history.forEach((entry: History) => {
            if (entry.userId) {
              uniqueUserIds.add(entry.userId);
            }
          });

          // Obtener todos los perfiles de usuario disponibles
          const allProfiles = await profileService.getAllUsers();
          
          // Mapear los perfiles a los usuarios encontrados en el historial
          const usersFromHistory = Array.from(uniqueUserIds).map(userId => {
            const profile = allProfiles.find(p => p.userId === userId);
            if (profile) {
              return {
                id: profile.userId,
                name: `${profile.userFirstName || ''} ${profile.userLastName || ''}`.trim() || profile.userEmail || userId,
                email: profile.userEmail || `${userId}@example.com`,
                avatar: profile.userProfileImgUrl || '/placeholder.svg'
              };
            } else {
              // Si no se encuentra el perfil, usar el UUID como fallback
              return {
                id: userId,
                name: userId.includes('@') ? userId.split('@')[0] : `Usuario ${userId.substring(0, 8)}`,
                email: userId.includes('@') ? userId : `${userId}@example.com`,
                avatar: '/placeholder.svg'
              };
            }
          });
          
          setUsers(usersFromHistory);
        } catch (error) {
          console.error('Error loading user profiles:', error);
          // En caso de error, usar los UUIDs como fallback
          const uniqueUserIds = new Set<string>();
          history.forEach((entry: History) => {
            if (entry.userId) {
              uniqueUserIds.add(entry.userId);
            }
          });
          
          const usersFromHistory = Array.from(uniqueUserIds).map(userId => ({
            id: userId,
            name: userId.includes('@') ? userId.split('@')[0] : `Usuario ${userId.substring(0, 8)}`,
            email: userId.includes('@') ? userId : `${userId}@example.com`,
            avatar: '/placeholder.svg'
          }));
          
          setUsers(usersFromHistory);
        }
      } else {
        // Si no hay historial, usar un array vacío
        setUsers([]);
      }
    };

    loadUserProfiles();
  }, [history]);

  const handleFilter = () => {
    const filters: any = { projectId };
    
    if (filterUserId && filterUserId !== 'all') filters.userId = filterUserId;
    if (filterChangeType && filterChangeType !== 'all') filters.changeType = filterChangeType;
    if (filterEntityType && filterEntityType !== 'all') filters.entityType = filterEntityType;
    
    getHistory(filters);
  };

  const clearFilters = () => {
    setFilterUserId('');
    setFilterChangeType('');
    setFilterEntityType('');
    setSearchTerm('');
    getHistory({ projectId });
  };

  const getChangeTypeColor = (changeType: string | ChangeType) => {
    const changeTypeStr = String(changeType).toLowerCase();
    if (changeTypeStr.includes('created') || changeTypeStr === 'create') return CHANGE_TYPE_COLORS.created;
    if (changeTypeStr.includes('updated') || changeTypeStr === 'update') return CHANGE_TYPE_COLORS.updated;
    if (changeTypeStr.includes('deleted') || changeTypeStr === 'delete') return CHANGE_TYPE_COLORS.deleted;
    if (changeTypeStr.includes('status_changed')) return CHANGE_TYPE_COLORS.status_changed;
    if (changeTypeStr.includes('assigned')) return CHANGE_TYPE_COLORS.assigned;
    return CHANGE_TYPE_COLORS.default;
  };

  const getEntityIcon = (entityType: string) => {
    // Normalizar entityType para que coincida con las claves del objeto
    const normalizedType = entityType === 'user_story' ? 'userStory' : 
                          entityType === 'key_result' ? 'keyResult' :
                          entityType === 'User Story' ? 'userStory' :
                          entityType === 'Key Result' ? 'keyResult' :
                          entityType === 'Project' ? 'project' :
                          entityType === 'Task' ? 'task' :
                          entityType === 'Okr' ? 'okr' :
                          entityType === 'Sprint' ? 'sprint' :
                          entityType.toLowerCase() === 'sprint' ? 'sprint' :
                          entityType === 'Comment' ? 'comment' :
                          entityType === 'Member' ? 'member' :
                          entityType === 'Meeting' ? 'meeting' :
                          entityType.toLowerCase() === 'meeting' ? 'meeting' :
                          entityType;
    const IconComponent = CHANGE_TYPE_ICONS[normalizedType as EntityType] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      return user.name || user.email || `Usuario ${userId.substring(0, 8)}`;
    }
    // Si no se encuentra el usuario, generar un nombre desde el userId
    if (userId.includes('@')) {
      return userId.split('@')[0];
    }
    return `Usuario ${userId.substring(0, 8)}`;
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    // Solo retornar el avatar si existe y no es un placeholder
    if (user?.avatar && user.avatar !== '/placeholder.svg' && user.avatar.trim() !== '') {
      return user.avatar;
    }
    return undefined; // Retornar undefined para que se muestre el fallback
  };

  const getEntityInitial = (entityType: string) => {
    const normalizedType = normalizeEntityType(entityType);
    // Mapeo de tipos de entidad a sus iniciales
    const entityInitials: Record<string, string> = {
      'project': 'P',
      'userStory': 'H',
      'user_story': 'H',
      'task': 'T',
      'sprint': 'S',
      'objective': 'O',
      'okr': 'O',
      'keyResult': 'K',
      'key_result': 'K',
      'comment': 'C',
      'member': 'M',
      'meeting': 'R',
      'invitation': 'I',
      'permission': 'P'
    };
    return entityInitials[normalizedType] || '?';
  };

  // Función para normalizar entityType
  const normalizeEntityType = (entityType: string): EntityType => {
    const normalized = entityType === 'user_story' ? 'userStory' : 
                      entityType === 'key_result' ? 'keyResult' :
                      entityType === 'User Story' ? 'userStory' :
                      entityType === 'Key Result' ? 'keyResult' :
                      entityType === 'Project' ? 'project' :
                      entityType === 'Task' ? 'task' :
                      entityType === 'Okr' ? 'okr' :
                      entityType;
    return normalized as EntityType;
  };

  // Función para normalizar changeType
  const normalizeChangeType = (changeType: string, entityType: string): ChangeType => {
    const normalizedEntity = normalizeEntityType(entityType);
    const changeTypeStr = changeType.toUpperCase();
    
    if (changeTypeStr === 'CREATE') {
      return `${normalizedEntity}_created` as ChangeType;
    }
    if (changeTypeStr === 'UPDATE') {
      return `${normalizedEntity}_updated` as ChangeType;
    }
    if (changeTypeStr === 'DELETE') {
      return `${normalizedEntity}_deleted` as ChangeType;
    }
    
    return changeType as ChangeType;
  };

  const filteredHistory = history.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const normalizedChangeType = normalizeChangeType(entry.changeType, entry.entityType);
    const normalizedEntityType = normalizeEntityType(entry.entityType);
    const changeTypeLabel = CHANGE_TYPE_LABELS[normalizedChangeType] || entry.changeType;
    const entityTypeLabel = ENTITY_TYPE_LABELS[normalizedEntityType] || entry.entityType;
    return (
      entry.description.toLowerCase().includes(searchLower) ||
      changeTypeLabel.toLowerCase().includes(searchLower) ||
      entityTypeLabel.toLowerCase().includes(searchLower)
    );
  });

  return (
    <PermissionGuard
      projectId={projectId}
      userId={user?.id || ""}
      requiredPermission="read"
      showError={true}
    >
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Cambios
          </CardTitle>
          <CardDescription>
            Registro detallado de todas las modificaciones realizadas en el proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar en descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterChangeType} onValueChange={(value) => setFilterChangeType(value as ChangeType | 'all' | '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de cambio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(CHANGE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEntityType} onValueChange={(value) => setFilterEntityType(value as EntityType | 'all' | '')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las entidades</SelectItem>
                {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Limpiar
            </Button>
            {error && (
              <Button onClick={retryLastOperation} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            )}
          </div>

          {/* Lista de cambios */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Cargando historial...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron cambios con los filtros aplicados
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredHistory.map((entry, index) => (
                  <div key={entry.id}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {getEntityIcon(entry.entityType)}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`font-medium ${
                            normalizeEntityType(entry.entityType) === 'sprint' 
                              ? 'bg-blue-500/10 text-blue-700 border border-blue-200'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {getEntityInitial(entry.entityType)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            className={getChangeTypeColor(entry.changeType)}
                            variant="outline"
                          >
                            {CHANGE_TYPE_LABELS[normalizeChangeType(entry.changeType, entry.entityType)] || entry.changeType}
                          </Badge>
                          <Badge variant="secondary">
                            {ENTITY_TYPE_LABELS[normalizeEntityType(entry.entityType)] || entry.entityType}
                          </Badge>
                          {entry.metadata?.source === 'ai_generated' && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              IA
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium">
                          {entry.description}
                        </p>
                        
                        {Object.keys(entry.details).length > 0 && (
                          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                            {Object.entries(entry.details).map(([key, value]) => {
                              // Formatear valores de status y priority
                              let formattedValue = value;
                              const keyLower = key.toLowerCase();
                              
                              if (keyLower === 'status') {
                                const statusStr = String(value).toUpperCase();
                                if (statusStr === 'TODO') formattedValue = 'Por hacer';
                                else if (statusStr === 'IN_PROGRESS') formattedValue = 'En Progreso';
                                else if (statusStr === 'DONE') formattedValue = 'Completado';
                                else if (statusStr === 'BLOCKED') formattedValue = 'Bloqueado';
                                else formattedValue = String(value);
                              } else if (keyLower === 'priority') {
                                const priorityStr = String(value).toUpperCase();
                                if (priorityStr === 'ALTA') formattedValue = 'Alta';
                                else if (priorityStr === 'MEDIA') formattedValue = 'Media';
                                else if (priorityStr === 'BAJA') formattedValue = 'Baja';
                                else {
                                  // Si ya está formateado, solo capitalizar primera letra
                                  const str = String(value);
                                  formattedValue = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                                }
                              } else if (keyLower === 'title' || keyLower === 'name') {
                                // Mantener title y name tal cual, pero asegurar que se muestren bien
                                formattedValue = String(value);
                              } else if (keyLower === 'description') {
                                // Mantener description tal cual
                                formattedValue = String(value);
                              }
                              
                              // Mapeo de etiquetas en español
                              const getLabel = (key: string): string => {
                                const keyLower = key.toLowerCase();
                                const labelMap: Record<string, string> = {
                                  'status': 'Estado',
                                  'priority': 'Prioridad',
                                  'title': 'Título',
                                  'name': 'Nombre',
                                  'description': 'Descripción',
                                  'storypoints': 'Story Points',
                                  'story_points': 'Story Points',
                                  'estimatedhours': 'Horas Estimadas',
                                  'estimated_hours': 'Horas Estimadas',
                                  'assignedto': 'Asignado a',
                                  'assigned_to': 'Asignado a',
                                  'createdby': 'Creado por',
                                  'created_by': 'Creado por'
                                };
                                return labelMap[keyLower] || key.replace(/([A-Z])/g, ' $1').toLowerCase();
                              };
                              
                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium capitalize min-w-[100px]">
                                    {getLabel(key)}:
                                  </span>
                                  <span className="text-foreground break-words">
                                    {typeof formattedValue === 'object' && formattedValue !== null
                                      ? Array.isArray(formattedValue)
                                        ? formattedValue.join(', ')
                                        : JSON.stringify(formattedValue)
                                      : String(formattedValue)
                                    }
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getUserName(entry.userId)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < filteredHistory.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      </div>
    </PermissionGuard>
  );
}