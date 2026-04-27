'use client';

import StudentLayout from '../../student-layout';

export default function StudentSubmissionsPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-muted-foreground">Track your assignment submissions and grades.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Build your submissions listing here.
        </div>
      </div>
    </StudentLayout>
  );
}
