/**
 * Generation process messages for better UX
 * Messages displayed during AI generation to show progress
 */

export const GENERATION_MESSAGES = {
  STARTING: "🚀 Iniciando generación del proyecto...",
  ANALYZING: "🔍 Analizando tu prompt estructurado...",
  CREATING_STRUCTURE: "📋 Creando estructura del proyecto...",
  GENERATING_OBJECTIVES: "🎯 Generando objetivos SMART...",
  CREATING_TIMELINE: "📅 Estableciendo timeline y milestones...",
  GENERATING_BACKLOG: "📝 Estoy creando las User Stories...",
  APPLYING_US: "✨ Aplicando las User Stories al proyecto...",
  CREATING_SPRINTS: "🏃 Planificando sprints...",
  ASSIGNING_ROLES: "👥 Asignando roles y responsabilidades...",
  IDENTIFYING_RISKS: "⚠️ Identificando riesgos y mitigaciones...",
  SAVING_BACKLOG: "💾 Guardando Product Backlog...",
  CREATING_TASKS: "⚡ Generando tareas para cada User Story...",
  CREATING_PROJECT: "🎨 Creando el proyecto...",
  FINALIZING: "✅ Finalizando generación...",
  SUCCESS: "🎉 ¡Proyecto creado exitosamente!",
  ERROR: "❌ Ocurrió un error durante la generación",
}

export type GenerationStep =
  | "starting"
  | "analyzing"
  | "creating_structure"
  | "generating_objectives"
  | "creating_timeline"
  | "generating_backlog"
  | "applying_us"
  | "creating_sprints"
  | "assigning_roles"
  | "identifying_risks"
  | "saving_backlog"
  | "creating_tasks"
  | "creating_project"
  | "finalizing"
  | "success"
  | "error"

export function getMessageForStep(step: GenerationStep): string {
  const messageMap: Record<GenerationStep, string> = {
    starting: GENERATION_MESSAGES.STARTING,
    analyzing: GENERATION_MESSAGES.ANALYZING,
    creating_structure: GENERATION_MESSAGES.CREATING_STRUCTURE,
    generating_objectives: GENERATION_MESSAGES.GENERATING_OBJECTIVES,
    creating_timeline: GENERATION_MESSAGES.CREATING_TIMELINE,
    generating_backlog: GENERATION_MESSAGES.GENERATING_BACKLOG,
    applying_us: GENERATION_MESSAGES.APPLYING_US,
    creating_sprints: GENERATION_MESSAGES.CREATING_SPRINTS,
    assigning_roles: GENERATION_MESSAGES.ASSIGNING_ROLES,
    identifying_risks: GENERATION_MESSAGES.IDENTIFYING_RISKS,
    saving_backlog: GENERATION_MESSAGES.SAVING_BACKLOG,
    creating_tasks: GENERATION_MESSAGES.CREATING_TASKS,
    creating_project: GENERATION_MESSAGES.CREATING_PROJECT,
    finalizing: GENERATION_MESSAGES.FINALIZING,
    success: GENERATION_MESSAGES.SUCCESS,
    error: GENERATION_MESSAGES.ERROR,
  }

  return messageMap[step]
}
