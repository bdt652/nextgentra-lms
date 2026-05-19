-- DropForeignKey
ALTER TABLE "ClassCourse" DROP CONSTRAINT "ClassCourse_course_id_fkey";

-- DropForeignKey
ALTER TABLE "ClassExam" DROP CONSTRAINT "ClassExam_exam_id_fkey";

-- AddForeignKey
ALTER TABLE "ClassCourse" ADD CONSTRAINT "ClassCourse_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassExam" ADD CONSTRAINT "ClassExam_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
