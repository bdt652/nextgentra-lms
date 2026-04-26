import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Teacher Courses Page
 *
 * This is a scaffold template. Replace with your actual implementation.
 *
 * What to build here:
 * - Course list with cards/grid
 * - Search and filter functionality
 * - Create new course button (opens modal)
 * - Course status indicators (draft, published, archived)
 * - Pagination for many courses
 *
 * API endpoints needed:
 * - GET /api/v1/courses?page=1&limit=20&status=published
 * - POST /api/v1/courses (create)
 * - GET /api/v1/courses/:id (view details)
 * - PUT /api/v1/courses/:id (update)
 * - DELETE /api/v1/courses/:id (delete)
 */

export const metadata: Metadata = {
  title: "My Courses",
  description: "Manage your courses",
};

export default async function TeacherCoursesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  // Example: Get query params
  const page = parseInt(searchParams.page || "1");
  const status = searchParams.status as "draft" | "published" | "archived" | undefined;

  // Example: Fetch data (uncomment when API is ready)
  // const response = await fetch(
  //   `${process.env.API_BASE_URL}/courses?page=${page}&limit=20${status ? `&status=${status}` : ""}`,
  //   { credentials: "include" }
  // );
  // const { data: courses, meta } = await response.json();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Create and manage your courses
          </p>
        </div>
        {/* Create button */}
        {/* <Button onClick={() => setCreateOpen(true)}>Create Course</Button> */}
      </div>

      {/* Filters */}
      {/* <div className="flex gap-2">
        <Button variant={!status ? "default" : "outline"} size="sm">All</Button>
        <Button variant={status === "draft" ? "default" : "outline"} size="sm">Drafts</Button>
        <Button variant={status === "published" ? "default" : "outline"} size="sm">Published</Button>
      </div> */}

      {/* Course Grid */}
      {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div> */}

      {/* Pagination */}
      {/* {meta && meta.total_pages > 1 && (
        <Pagination
          current={meta.page}
          total={meta.total_pages}
        />
      )} */}

      {/* Empty State */}
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          This is a scaffold. Implement your courses page here.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Use CourseCard component from @nextgentra/ui
        </p>
      </div>
    </div>
  );
}
