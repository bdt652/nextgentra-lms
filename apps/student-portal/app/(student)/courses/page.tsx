'use client';

import StudentLayout from '../../student-layout';

export default function StudentCoursesPage() {
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">Courses you are enrolled in.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Build your course listing here. Use the enrollment API to fetch courses.
        </div>
      </div>
    </StudentLayout>
  );
}
