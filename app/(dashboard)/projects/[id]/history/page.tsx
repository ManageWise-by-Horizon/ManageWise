'use client';

import { useParams } from 'next/navigation';
import { ProjectHistoryDashboard } from '@/components/projects/project-history-dashboard';

export default function ProjectHistoryPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="container mx-auto py-6">
      <ProjectHistoryDashboard projectId={projectId} />
    </div>
  );
}