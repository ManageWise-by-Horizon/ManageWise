'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useProjectHistory } from '@/hooks/use-project-history';
import { ProjectHistoryEntry, ChangeType, EntityType } from '@/lib/types/project-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
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
  Calendar
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
  'member_role_changed': 'Rol de miembro cambiado'
};

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  'project': 'Proyecto',
  'userStory': 'Historia de Usuario',
  'task': 'Tarea',
  'sprint': 'Sprint',
  'objective': 'Objetivo',
  'keyResult': 'Resultado Clave',
  'comment': 'Comentario',
  'member': 'Miembro'
};

const CHANGE_TYPE_ICONS: Record<string, any> = {
  'project': FolderOpen,
  'userStory': FileText,
  'task': CheckSquare,
  'sprint': Calendar,
  'objective': Target,
  'keyResult': Target,
  'comment': MessageSquare,
  'member': UserPlus
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
      // Verificar permisos
      if (user.role === 'developer') {
        toast({
          variant: "destructive",
          title: "Sin permisos",
          description: "No tienes permisos para ver el historial de cambios.",
        });
        return;
      }

      getHistory({ projectId });
      loadUsers();
    }
  }, [projectId, user, getHistory]);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

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

  const getChangeTypeColor = (changeType: ChangeType) => {
    if (changeType.includes('created')) return CHANGE_TYPE_COLORS.created;
    if (changeType.includes('updated')) return CHANGE_TYPE_COLORS.updated;
    if (changeType.includes('deleted')) return CHANGE_TYPE_COLORS.deleted;
    if (changeType.includes('status_changed')) return CHANGE_TYPE_COLORS.status_changed;
    if (changeType.includes('assigned')) return CHANGE_TYPE_COLORS.assigned;
    return CHANGE_TYPE_COLORS.default;
  };

  const getEntityIcon = (entityType: EntityType) => {
    const IconComponent = CHANGE_TYPE_ICONS[entityType] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuario desconocido';
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.avatar;
  };

  const filteredHistory = history.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.description.toLowerCase().includes(searchLower) ||
      CHANGE_TYPE_LABELS[entry.changeType].toLowerCase().includes(searchLower) ||
      ENTITY_TYPE_LABELS[entry.entityType].toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role === 'developer') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Sin permisos
          </CardTitle>
          <CardDescription>
            No tienes permisos para ver el historial de cambios del proyecto.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
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
                          <AvatarImage src={getUserAvatar(entry.userId)} />
                          <AvatarFallback>
                            {getUserName(entry.userId).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            className={getChangeTypeColor(entry.changeType)}
                            variant="outline"
                          >
                            {CHANGE_TYPE_LABELS[entry.changeType]}
                          </Badge>
                          <Badge variant="secondary">
                            {ENTITY_TYPE_LABELS[entry.entityType]}
                          </Badge>
                          {entry.metadata.source === 'ai_generated' && (
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
                            {Object.entries(entry.details).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium capitalize min-w-[80px]">
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </span>
                                <span className="text-foreground">
                                  {typeof value === 'object' && value !== null
                                    ? Array.isArray(value)
                                      ? value.join(', ')
                                      : JSON.stringify(value)
                                    : String(value)
                                  }
                                </span>
                              </div>
                            ))}
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
  );
}