/*
  Warnings:

  - You are about to drop the column `prerequisite_lesson_id` on the `Lesson` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_prerequisite_lesson_id_fkey";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "prerequisite_lesson_id";

-- CreateTable
CREATE TABLE "LessonPrerequisite" (
    "lesson_id" TEXT NOT NULL,
    "prerequisite_lesson_id" TEXT NOT NULL,

    CONSTRAINT "LessonPrerequisite_pkey" PRIMARY KEY ("lesson_id","prerequisite_lesson_id")
);

-- CreateIndex
CREATE INDEX "LessonPrerequisite_lesson_id_idx" ON "LessonPrerequisite"("lesson_id");

-- CreateIndex
CREATE INDEX "LessonPrerequisite_prerequisite_lesson_id_idx" ON "LessonPrerequisite"("prerequisite_lesson_id");

-- AddForeignKey
ALTER TABLE "LessonPrerequisite" ADD CONSTRAINT "LessonPrerequisite_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPrerequisite" ADD CONSTRAINT "LessonPrerequisite_prerequisite_lesson_id_fkey" FOREIGN KEY ("prerequisite_lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
