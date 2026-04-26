export const APP_NAME = "NextGenTra LMS";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const TEACHER_PORTAL_URL = process.env.NEXT_PUBLIC_TEACHER_URL || "http://localhost:3000";
export const STUDENT_PORTAL_URL = process.env.NEXT_PUBLIC_STUDENT_URL || "http://localhost:3001";

export const ROLES = {
  TEACHER: "teacher",
  STUDENT: "student",
  ADMIN: "admin",
} as const;

export const COURSE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;
