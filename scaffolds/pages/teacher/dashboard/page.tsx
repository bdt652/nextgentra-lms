import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Teacher Dashboard Page
 *
 * This is a scaffold template. Replace with your actual implementation.
 *
 * What to build here:
 * - Stats cards (courses, students, assignments)
 * - Recent activity feed
 * - Quick actions (create course, assignment)
 * - Charts/graphs of student progress
 *
 * API endpoints needed:
 * - GET /api/v1/teacher/dashboard/stats
 * - GET /api/v1/teacher/activity/recent
 */

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Teacher dashboard overview',
};

export default async function TeacherDashboardPage() {
  // Example: Check authentication
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login');
  }

  // Example: Fetch data (uncomment when API is ready)
  // const stats = await fetch(`${process.env.API_BASE_URL}/teacher/dashboard/stats`).then(r => r.json());
  // const activities = await fetch(`${process.env.API_BASE_URL}/teacher/activity/recent`).then(r => r.json());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user?.name || 'Teacher'}!</p>
        </div>
        {/* Quick actions */}
        {/* <Button>Create Course</Button> */}
      </div>

      {/* Stats Grid - Uncomment when data is available */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Courses" value={stats.total_courses} />
        <StatCard title="Active Students" value={stats.total_students} />
        <StatCard title="Assignments" value={stats.active_assignments} />
        <StatCard title="Pending Submissions" value={stats.pending_submissions} />
      </div> */}

      {/* Recent Activity */}
      {/* <Card>
        <Card.Header>
          <Card.Title>Recent Activity</Card.Title>
        </Card.Header>
        <Card.Content>
          <ActivityList activities={activities} />
        </Card.Content>
      </Card> */}

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          This is a scaffold. Implement your dashboard logic here.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          See docs/conventions/task-templates.md for guidance.
        </p>
      </div>
    </div>
  );
}
