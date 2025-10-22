const fs = require('fs');
const path = require('path');

// Script para limpiar datos huérfanos del db.json
// Ejecutar con: node scripts/cleanup-orphaned-data.js

function cleanupOrphanedData() {
  console.log('🧹 Iniciando limpieza de datos huérfanos...');

  // Leer el archivo db.json
  const dbPath = path.join(__dirname, '..', 'db.json');
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ No se encontró el archivo db.json');
    return;
  }

  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(dbContent);

  console.log('📊 Estado actual:');
  console.log(`- Proyectos: ${db.projects?.length || 0}`);
  console.log(`- Backlogs: ${db.backlogs?.length || 0}`);
  console.log(`- User Stories: ${db.userStories?.length || 0}`);
  console.log(`- Tasks: ${db.tasks?.length || 0}`);
  console.log(`- Sprints: ${db.sprints?.length || 0}`);
  console.log(`- Meetings: ${db.meetings?.length || 0}`);

  // Crear backup
  const backupPath = path.join(__dirname, '..', `db.json.backup.${Date.now()}`);
  fs.writeFileSync(backupPath, dbContent);
  console.log(`💾 Backup creado: ${backupPath}`);

  // Obtener IDs de proyectos existentes
  const existingProjectIds = new Set((db.projects || []).map(project => project.id));
  
  let cleanedItems = 0;

  // Limpiar backlogs huérfanos
  if (db.backlogs) {
    const originalBacklogsCount = db.backlogs.length;
    db.backlogs = db.backlogs.filter(backlog => {
      if (backlog.projectId === null || !existingProjectIds.has(backlog.projectId)) {
        cleanedItems++;
        return false;
      }
      return true;
    });
    console.log(`🗑️  Backlogs eliminados: ${originalBacklogsCount - db.backlogs.length}`);
  }

  // Limpiar user stories huérfanas
  if (db.userStories) {
    const originalUserStoriesCount = db.userStories.length;
    db.userStories = db.userStories.filter(story => {
      if (story.projectId === null || !existingProjectIds.has(story.projectId)) {
        cleanedItems++;
        return false;
      }
      return true;
    });
    console.log(`🗑️  User Stories eliminadas: ${originalUserStoriesCount - db.userStories.length}`);
  }

  // Limpiar tasks huérfanas
  if (db.tasks) {
    const originalTasksCount = db.tasks.length;
    db.tasks = db.tasks.filter(task => {
      if (task.projectId === null || !existingProjectIds.has(task.projectId)) {
        cleanedItems++;
        return false;
      }
      return true;
    });
    console.log(`🗑️  Tasks eliminadas: ${originalTasksCount - db.tasks.length}`);
  }

  // Limpiar sprints huérfanos
  if (db.sprints) {
    const originalSprintsCount = db.sprints.length;
    db.sprints = db.sprints.filter(sprint => {
      if (sprint.projectId === null || !existingProjectIds.has(sprint.projectId)) {
        cleanedItems++;
        return false;
      }
      return true;
    });
    console.log(`🗑️  Sprints eliminados: ${originalSprintsCount - db.sprints.length}`);
  }

  // Limpiar meetings huérfanas
  if (db.meetings) {
    const originalMeetingsCount = db.meetings.length;
    db.meetings = db.meetings.filter(meeting => {
      if (meeting.projectId === null || !existingProjectIds.has(meeting.projectId)) {
        cleanedItems++;
        return false;
      }
      return true;
    });
    console.log(`🗑️  Meetings eliminadas: ${originalMeetingsCount - db.meetings.length}`);
  }

  // Guardar el archivo limpio
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  console.log('✅ Limpieza completada!');
  console.log(`📊 Total de elementos eliminados: ${cleanedItems}`);
  console.log('📊 Estado final:');
  console.log(`- Proyectos: ${db.projects?.length || 0}`);
  console.log(`- Backlogs: ${db.backlogs?.length || 0}`);
  console.log(`- User Stories: ${db.userStories?.length || 0}`);
  console.log(`- Tasks: ${db.tasks?.length || 0}`);
  console.log(`- Sprints: ${db.sprints?.length || 0}`);
  console.log(`- Meetings: ${db.meetings?.length || 0}`);
}

// Ejecutar la limpieza
cleanupOrphanedData();