-- AlterTable
ALTER TABLE "ClassExam" ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "question_limit" INTEGER,
ADD COLUMN     "shuffle_questions" BOOLEAN NOT NULL DEFAULT false;
