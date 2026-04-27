'use client';

import StudentLayout from '../../student-layout';

export default function StudentAssignmentsPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">Your assignments and submissions.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Build your assignments listing here. Use the submissions API.
        </div>
      </div>
    </StudentLayout>
  );
}
