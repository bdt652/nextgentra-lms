-- AlterTable
ALTER TABLE "LessonQuestion" ADD COLUMN     "is_extension" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LessonQuestionPrerequisite" (
    "id" TEXT NOT NULL,
    "lesson_question_id" TEXT NOT NULL,
    "prerequisite_id" TEXT NOT NULL,

    CONSTRAINT "LessonQuestionPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonQuestionPrerequisite_lesson_question_id_idx" ON "LessonQuestionPrerequisite"("lesson_question_id");

-- CreateIndex
CREATE INDEX "LessonQuestionPrerequisite_prerequisite_id_idx" ON "LessonQuestionPrerequisite"("prerequisite_id");

-- CreateIndex
CREATE UNIQUE INDEX "LessonQuestionPrerequisite_lesson_question_id_prerequisite__key" ON "LessonQuestionPrerequisite"("lesson_question_id", "prerequisite_id");

-- AddForeignKey
ALTER TABLE "LessonQuestionPrerequisite" ADD CONSTRAINT "LessonQuestionPrerequisite_lesson_question_id_fkey" FOREIGN KEY ("lesson_question_id") REFERENCES "LessonQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonQuestionPrerequisite" ADD CONSTRAINT "LessonQuestionPrerequisite_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "LessonQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
