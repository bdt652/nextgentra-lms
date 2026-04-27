# Initial migration

This migration creates all tables for the LMS:
- users (with role enum)
- courses
- lessons
- assignments
- enrollments
- submissions

All foreign keys with cascade deletes.
Unique constraints on email, enrollments (student+course), submissions (student+assignment).
