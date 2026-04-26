import type { Metadata } from "next";

/**
 * Student Courses Page
 *
 * This is a scaffold template. Replace with your actual implementation.
 *
 * What to build here:
 * - List of enrolled courses with progress
 * - Course cards with thumbnail, title, teacher name
 * - Progress indicator per course
 * - Continue learning button (resume last lesson)
 * - Filter/sort (in progress, completed, not started)
 *
 * API endpoints needed:
 * - GET /api/v1/student/enrollments
 * - GET /api/v1/courses/:id (with enrollment data)
 * - POST /api/v1/enrollments (enroll in course)
 */

export const metadata: Metadata = {
  title: "My Courses",
  description: "View your enrolled courses",
};

export default async function StudentCoursesPage() {
  // Example: Fetch enrolled courses
  // const response = await fetch(`${process.env.API_BASE_URL}/student/enrollments`, {
  //   credentials: "include"
  // });
  // const { data: enrollments } = await response.json();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground">
          Continue learning and track your progress
        </p>
      </div>

      {/* Filter tabs */}
      {/* <Tabs defaultValue="in-progress">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </Tabs.List>
      </Tabs> */}

      {/* Course List */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {enrollments?.map(({ course, progress }) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={progress}
            showProgress
          />
        ))}
      </div> */}

      {/* Browse Courses (if no enrollments) */}
      {/* <Card className="bg-primary/5">
        <Card.Header>
          <Card.Title>Explore Courses</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>You haven't enrolled in any courses yet.</p>
          <Button className="mt-4">Browse Catalog</Button>
        </Card.Content>
      </Card> */}

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          This is a scaffold. Implement your student courses page here.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Show enrolled courses with progress tracking.
        </p>
      </div>
    </div>
  );
}
