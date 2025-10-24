# Sistema de Historial de Cambios del Proyecto

## Descripción General

El sistema de historial de cambios permite registrar automáticamente todas las modificaciones realizadas en un proyecto, proporcionando una auditoría completa de las acciones realizadas por los usuarios.

## Características Implementadas

### ✅ Escenario 1: Registro exitoso de un cambio
- **Funcionalidad**: Registro automático cuando se detecta una modificación
- **Implementación**: Hook `useProjectHistory` que se integra en otros hooks
- **Datos registrados**: Fecha, usuario, tipo de cambio, descripción, detalles

### ✅ Escenario 2: Visualización del historial completo
- **Funcionalidad**: Interfaz para consultar todos los cambios
- **Implementación**: Componente `ProjectHistoryDashboard`
- **Acceso**: Tab "Historial" en la página del proyecto
- **Ordenamiento**: Por fecha (más reciente primero)

### ✅ Escenario 3: Filtro por tipo de cambio
- **Tipos soportados**: 
  - Proyectos (creado, actualizado, eliminado, estado cambiado)
  - Historias de usuario (creado, actualizado, eliminado, estado/prioridad cambiado)
  - Tareas (creado, actualizado, eliminado, estado cambiado, asignado/desasignado)
  - Sprints (creado, actualizado, eliminado, iniciado, completado)
  - OKRs (objetivos y resultados clave creados/actualizados/eliminados, progreso actualizado)
  - Comentarios (creado, actualizado, eliminado)
  - Miembros (agregado, removido, rol cambiado)

### ✅ Escenario 4: Filtro por usuario
- **Funcionalidad**: Filtrar cambios por usuario específico
- **Implementación**: Dropdown con lista de usuarios del sistema
- **Información mostrada**: Nombre y avatar del usuario

### ✅ Escenario 5: Control de permisos
- **Restricción**: Solo usuarios con rol diferente a 'developer' pueden ver el historial
- **Mensaje**: Se muestra mensaje claro cuando no se tienen permisos
- **Implementación**: Verificación en el componente `ProjectHistoryDashboard`

### ✅ Escenario 6: Manejo de errores
- **Auto-retry**: Reintento automático después de 2 segundos si falla el registro
- **Notificaciones**: Toast de error cuando falla y éxito cuando se recupera
- **Reintento manual**: Botón para reintentar la última operación

## Estructura de Datos

### ProjectHistoryEntry
```typescript
interface ProjectHistoryEntry {
  id: string;                    // ID único del registro
  projectId: string;             // ID del proyecto
  userId: string;                // ID del usuario que realizó el cambio
  changeType: ChangeType;        // Tipo específico de cambio
  entityType: EntityType;        // Tipo de entidad modificada
  entityId: string;              // ID de la entidad modificada
  description: string;           // Descripción legible del cambio
  details: Record<string, any>;  // Detalles específicos del cambio
  timestamp: string;             // Fecha y hora ISO del cambio
  userAgent: string;             // Información del cliente
  metadata: {
    source: 'manual' | 'ai_generated' | 'system';
    version: string;
    [key: string]: any;
  };
}
```

## Uso del Sistema

### 1. Hook Principal
```typescript
import { useProjectHistory } from '@/hooks/use-project-history';

const { logChange, getHistory, loading, error } = useProjectHistory();
```

### 2. Hook Auxiliar para Auto-logging
```typescript
import { useAutoLogChange } from '@/hooks/use-project-history';

const { logProjectChange } = useAutoLogChange({
  userId: user?.id || '',
  projectId: 'project-id',
  source: 'manual'
});
```

### 3. Registrar un Cambio
```typescript
await logProjectChange(
  'task_created',      // Tipo de cambio
  'task',              // Tipo de entidad
  'task-123',          // ID de la entidad
  'Tarea creada: Implementar login',  // Descripción
  {                    // Detalles adicionales
    title: 'Implementar login',
    assignedTo: 'user-456',
    priority: 'high'
  }
);
```

### 4. Obtener Historial con Filtros
```typescript
await getHistory({
  projectId: 'project-123',
  userId: 'user-456',
  changeType: 'task_created',
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

## Integración en Componentes Existentes

El sistema está diseñado para integrarse fácilmente en hooks existentes. Ver el archivo `examples/project-history-integration.ts` para ejemplos detallados de cómo integrar el logging automático en:

- Creación/actualización de proyectos
- Gestión de tareas
- Historias de usuario
- OKRs y resultados clave
- Gestión de miembros

## Acceso al Historial

1. **Navegar a un proyecto**: `/projects/[id]`
2. **Seleccionar tab "Historial"**: El tab aparece junto a otros tabs del proyecto
3. **Aplicar filtros**: Usar los controles de filtrado para encontrar cambios específicos
4. **Búsqueda**: Buscar por texto en las descripciones de cambios

## Permisos

- **Scrum Master**: Acceso completo al historial
- **Product Owner**: Acceso completo al historial
- **Team Lead**: Acceso completo al historial
- **Developer**: Sin acceso al historial (muestra mensaje de permisos insuficientes)

## Base de Datos

Los registros se almacenan en la tabla `projectHistory` en `db.json` con la estructura definida en `ProjectHistoryEntry`.

## Próximas Mejoras

- Exportar historial a CSV/PDF
- Notificaciones en tiempo real de cambios
- Historial de cambios específico por entidad
- Métricas y análisis de actividad del proyecto
- Integración con webhooks para sistemas externos