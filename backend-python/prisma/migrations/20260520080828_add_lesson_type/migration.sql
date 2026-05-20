-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('lecture', 'quiz', 'assignment', 'document');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "lesson_type" "LessonType" NOT NULL DEFAULT 'lecture';
