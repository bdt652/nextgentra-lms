"""Full API smoke test — runs against live server at localhost:8000."""

import sys
import time

import httpx

# Unique suffix per run to avoid conflicts with leftover test data
RUN = str(int(time.time()))[-6:]

BASE = "http://localhost:8000"
c = httpx.Client(base_url=BASE, timeout=20)

PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "---"

errors: list[str] = []


def check(label: str, r: httpx.Response, expected: int | list[int]) -> dict:
    expected_codes = [expected] if isinstance(expected, int) else expected
    ok = r.status_code in expected_codes
    icon = PASS if ok else FAIL
    print(f"  {icon} [{r.status_code}] {label}")
    if not ok:
        errors.append(f"{label}: expected {expected_codes}, got {r.status_code} -- {r.text[:200]}")
    try:
        return r.json()
    except Exception:
        return {}


def section(title: str) -> None:
    print(f"\n{INFO} {title}")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
section("Health")
check("GET /health", c.get("/health"), [200, 503])  # 503 when Redis is down

# ---------------------------------------------------------------------------
# Teacher Auth
# ---------------------------------------------------------------------------
section("Teacher Auth — register & login")

# Register teacher (admin role must exist — seeded by prisma/seed.py)
ADMIN_EMAIL = f"admin_{RUN}@test.com"
TEACHER2_EMAIL = f"teacher2_{RUN}@test.com"
STUDENT_EMAIL = f"student_{RUN}@test.com"
STUDENT_CODE = f"STU{RUN}"

reg = check(
    "POST /auth/teacher/register",
    c.post(
        "/auth/teacher/register",
        json={
            "email": ADMIN_EMAIL,
            "name": "Admin Teacher",
            "password": "password123",
            "role": "admin",
        },
    ),
    201,
)

# Duplicate should fail
check(
    "POST /auth/teacher/register (duplicate)",
    c.post(
        "/auth/teacher/register",
        json={
            "email": ADMIN_EMAIL,
            "name": "Admin Teacher",
            "password": "password123",
            "role": "admin",
        },
    ),
    400,
)

# Login
login = check(
    "POST /auth/teacher/login",
    c.post("/auth/teacher/login", json={"email": ADMIN_EMAIL, "password": "password123"}),
    200,
)
teacher_token = login.get("access_token", "")
teacher_refresh = login.get("refresh_token", "")
th = {"Authorization": f"Bearer {teacher_token}"}

# Wrong password
check(
    "POST /auth/teacher/login (wrong password)",
    c.post("/auth/teacher/login", json={"email": ADMIN_EMAIL, "password": "wrong"}),
    401,
)

# Me
me = check("GET /auth/teacher/me", c.get("/auth/teacher/me", headers=th), 200)

# Refresh
ref = check(
    "POST /auth/teacher/refresh",
    c.post("/auth/teacher/refresh", json={"refresh_token": teacher_refresh}),
    200,
)
teacher_token = ref.get("access_token", teacher_token)
teacher_refresh = ref.get("refresh_token", teacher_refresh)
th = {"Authorization": f"Bearer {teacher_token}"}

# ---------------------------------------------------------------------------
# Admin — Roles & Permissions
# ---------------------------------------------------------------------------
section("Admin — Roles & Permissions")

roles = check("GET /admin/roles", c.get("/admin/roles", headers=th), 200)
role_list: list = roles if isinstance(roles, list) else []
admin_role = next((r for r in role_list if r.get("name") == "admin"), None)
teacher_role = next((r for r in role_list if r.get("name") == "teacher"), None)

perms = check("GET /admin/permissions", c.get("/admin/permissions", headers=th), 200)
perm_list: list = perms if isinstance(perms, list) else []

# Create a new role
new_role = check(
    "POST /admin/roles",
    c.post(
        "/admin/roles",
        headers=th,
        json={
            "name": "test_role",
            "description": "Temporary test role",
            "permission_ids": [p["id"] for p in perm_list[:2]] if perm_list else [],
        },
    ),
    201,
)
test_role_id = new_role.get("id")

# Update role
if test_role_id:
    check(
        "PATCH /admin/roles/{id}",
        c.patch(f"/admin/roles/{test_role_id}", headers=th, json={"description": "Updated"}),
        200,
    )

# List teachers
teachers_resp = check("GET /admin/teachers", c.get("/admin/teachers", headers=th), 200)
teacher_list: list = teachers_resp if isinstance(teachers_resp, list) else []
admin_teacher = next((t for t in teacher_list if t["email"] == ADMIN_EMAIL), None)
admin_teacher_id = admin_teacher["id"] if admin_teacher else None

# Register a plain teacher and assign role
reg2 = check(
    "POST /auth/teacher/register (teacher role)",
    c.post(
        "/auth/teacher/register",
        json={
            "email": TEACHER2_EMAIL,
            "name": "Plain Teacher",
            "password": "password123",
            "role": "teacher",
        },
    ),
    201,
)
teacher2_id = reg2.get("id")

if teacher2_id and teacher_role:
    check(
        "PATCH /admin/teachers/{id}/role",
        c.patch(
            f"/admin/teachers/{teacher2_id}/role", headers=th, json={"role_id": teacher_role["id"]}
        ),
        200,
    )

if teacher2_id:
    check(
        "PATCH /admin/teachers/{id}",
        c.patch(f"/admin/teachers/{teacher2_id}", headers=th, json={"name": "Updated Teacher"}),
        200,
    )
    check(
        "POST /admin/teachers/{id}/reset-password",
        c.post(
            f"/admin/teachers/{teacher2_id}/reset-password",
            headers=th,
            json={"new_password": "newpass123"},
        ),
        204,
    )

# Delete test_role (no teachers assigned)
if test_role_id:
    check(
        "DELETE /admin/roles/{id}",
        c.delete(f"/admin/roles/{test_role_id}", headers=th),
        204,
    )

# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
section("Categories")

cat = check(
    "POST /categories",
    c.post("/categories", headers=th, json={"name": "Math", "color": "#FF0000", "icon": "📐"}),
    201,
)
cat_id = cat.get("id")

check("GET /categories", c.get("/categories", headers=th), 200)

if cat_id:
    check("GET /categories/{id}", c.get(f"/categories/{cat_id}", headers=th), 200)
    check(
        "PATCH /categories/{id}",
        c.patch(f"/categories/{cat_id}", headers=th, json={"name": "Mathematics"}),
        200,
    )

# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------
section("Courses")

course = check(
    "POST /courses",
    c.post(
        "/courses",
        headers=th,
        json={
            "title": "Intro to Python",
            "description": "Learn Python basics",
            "category_id": cat_id,
        },
    ),
    201,
)
course_id = course.get("id")

check("GET /courses", c.get("/courses", headers=th), 200)
check("GET /courses?mine=true", c.get("/courses?mine=true", headers=th), 200)
if cat_id:
    check(
        f"GET /courses?category_id={cat_id}",
        c.get(f"/courses?category_id={cat_id}", headers=th),
        200,
    )

if course_id:
    check("GET /courses/{id}", c.get(f"/courses/{course_id}", headers=th), 200)
    check(
        "PATCH /courses/{id}",
        c.patch(f"/courses/{course_id}", headers=th, json={"title": "Python Fundamentals"}),
        200,
    )
    check("POST /courses/{id}/publish", c.post(f"/courses/{course_id}/publish", headers=th), 200)

    # Lessons
    section("Lessons")
    lesson = check(
        "POST /courses/{id}/lessons",
        c.post(
            f"/courses/{course_id}/lessons",
            headers=th,
            json={
                "title": "Lesson 1: Variables",
                "content": "Variables store data",
                "order": 0,
            },
        ),
        201,
    )
    lesson_id = lesson.get("id")

    check("GET /courses/{id}/lessons", c.get(f"/courses/{course_id}/lessons", headers=th), 200)

    if lesson_id:
        check(
            "GET /courses/{id}/lessons/{lid}",
            c.get(f"/courses/{course_id}/lessons/{lesson_id}", headers=th),
            200,
        )
        check(
            "PATCH /courses/{id}/lessons/{lid}",
            c.patch(
                f"/courses/{course_id}/lessons/{lesson_id}", headers=th, json={"is_published": True}
            ),
            200,
        )

        # Attachments
        att = check(
            "POST /courses/{id}/lessons/{lid}/attachments",
            c.post(
                f"/courses/{course_id}/lessons/{lesson_id}/attachments",
                headers=th,
                json={
                    "name": "Slide 1",
                    "file_url": "https://example.com/slide1.pdf",
                    "file_type": "pdf",
                },
            ),
            201,
        )
        att_id = att.get("id")
        if att_id:
            check(
                "DELETE /courses/{id}/lessons/{lid}/attachments/{aid}",
                c.delete(
                    f"/courses/{course_id}/lessons/{lesson_id}/attachments/{att_id}", headers=th
                ),
                204,
            )

        # Reorder
        lesson2 = c.post(
            f"/courses/{course_id}/lessons", headers=th, json={"title": "Lesson 2", "order": 1}
        ).json()
        lesson2_id = lesson2.get("id")
        if lesson2_id:
            check(
                "POST /courses/{id}/lessons/reorder",
                c.post(
                    f"/courses/{course_id}/lessons/reorder",
                    headers=th,
                    json={"items": [{"id": lesson_id, "order": 1}, {"id": lesson2_id, "order": 0}]},
                ),
                200,
            )
            check(
                "DELETE /courses/{id}/lessons/{lid} (lesson2)",
                c.delete(f"/courses/{course_id}/lessons/{lesson2_id}", headers=th),
                204,
            )

        check(
            "DELETE /courses/{id}/lessons/{lid}",
            c.delete(f"/courses/{course_id}/lessons/{lesson_id}", headers=th),
            204,
        )
else:
    lesson_id = None

# ---------------------------------------------------------------------------
# Exams
# ---------------------------------------------------------------------------
section("Exams")

exam = check(
    "POST /exams",
    c.post(
        "/exams",
        headers=th,
        json={
            "title": "Python Quiz",
            "description": "Test your Python knowledge",
            "duration": 30,
            "pass_score": 70.0,
            "category_id": cat_id,
        },
    ),
    201,
)
exam_id = exam.get("id")

check("GET /exams", c.get("/exams", headers=th), 200)
check("GET /exams?mine=true", c.get("/exams?mine=true", headers=th), 200)

if exam_id:
    check("GET /exams/{id}", c.get(f"/exams/{exam_id}", headers=th), 200)
    check(
        "PATCH /exams/{id}",
        c.patch(f"/exams/{exam_id}", headers=th, json={"title": "Python Quiz v2"}),
        200,
    )

    # Questions
    section("Questions")
    q = check(
        "POST /exams/{id}/questions",
        c.post(
            f"/exams/{exam_id}/questions",
            headers=th,
            json={
                "content": "What is Python?",
                "type": "multiple_choice",
                "options": ["A language", "A snake", "Both", "Neither"],
                "correct_answer": "A language",
                "points": 1.0,
                "order": 0,
            },
        ),
        201,
    )
    q_id = q.get("id")

    q2 = check(
        "POST /exams/{id}/questions (q2)",
        c.post(
            f"/exams/{exam_id}/questions",
            headers=th,
            json={
                "content": "Is Python interpreted?",
                "type": "true_false",
                "correct_answer": "true",
                "points": 1.0,
                "order": 1,
            },
        ),
        201,
    )
    q2_id = q2.get("id")

    if q_id:
        check(
            "PATCH /exams/{id}/questions/{qid}",
            c.patch(f"/exams/{exam_id}/questions/{q_id}", headers=th, json={"points": 2.0}),
            200,
        )

    if q_id and q2_id:
        check(
            "POST /exams/{id}/questions/reorder",
            c.post(
                f"/exams/{exam_id}/questions/reorder",
                headers=th,
                json={"items": [{"id": q_id, "order": 1}, {"id": q2_id, "order": 0}]},
            ),
            200,
        )
        check(
            "DELETE /exams/{id}/questions/{qid}",
            c.delete(f"/exams/{exam_id}/questions/{q2_id}", headers=th),
            204,
        )

# ---------------------------------------------------------------------------
# Classes
# ---------------------------------------------------------------------------
section("Classes")

cls_ = check(
    "POST /classes",
    c.post(
        "/classes",
        headers=th,
        json={
            "name": "Python 101",
            "description": "Beginner class",
        },
    ),
    201,
)
class_id = cls_.get("id")

check("GET /classes", c.get("/classes", headers=th), 200)

if class_id:
    check("GET /classes/{id}", c.get(f"/classes/{class_id}", headers=th), 200)
    check(
        "PATCH /classes/{id}",
        c.patch(f"/classes/{class_id}", headers=th, json={"description": "Updated description"}),
        200,
    )

    # Assign course to class
    if course_id:
        check(
            "POST /classes/{id}/courses",
            c.post(f"/classes/{class_id}/courses", headers=th, json={"course_id": course_id}),
            201,
        )
        check("GET /classes/{id}/courses", c.get(f"/classes/{class_id}/courses", headers=th), 200)

    # Assign exam to class
    if exam_id:
        check(
            "POST /classes/{id}/exams",
            c.post(f"/classes/{class_id}/exams", headers=th, json={"exam_id": exam_id}),
            201,
        )
        check("GET /classes/{id}/exams", c.get(f"/classes/{class_id}/exams", headers=th), 200)

    # Add a different teacher to class (admin is already auto-added as owner on create)
    if teacher2_id:
        check(
            "POST /classes/{id}/teachers",
            c.post(
                f"/classes/{class_id}/teachers",
                headers=th,
                json={
                    "teacher_id": teacher2_id,
                    "role": "primary",
                },
            ),
            201,
        )
        check("GET /classes/{id}/teachers", c.get(f"/classes/{class_id}/teachers", headers=th), 200)

# ---------------------------------------------------------------------------
# Student Auth
# ---------------------------------------------------------------------------
section("Student Auth")

sreg = check(
    "POST /auth/student/register",
    c.post(
        "/auth/student/register",
        json={
            "email": STUDENT_EMAIL,
            "name": "Alice",
            "student_code": STUDENT_CODE,
            "password": "pass123",
        },
    ),
    201,
)

# Duplicate student code
check(
    "POST /auth/student/register (dup code)",
    c.post(
        "/auth/student/register",
        json={
            "email": f"other_{RUN}@test.com",
            "name": "Bob",
            "student_code": STUDENT_CODE,
            "password": "pass123",
        },
    ),
    400,
)

slogin = check(
    "POST /auth/student/login",
    c.post("/auth/student/login", json={"email": STUDENT_EMAIL, "password": "pass123"}),
    200,
)
student_token = slogin.get("access_token", "")
student_refresh = slogin.get("refresh_token", "")
sh = {"Authorization": f"Bearer {student_token}"}

check("GET /auth/student/me", c.get("/auth/student/me", headers=sh), 200)

sref = check(
    "POST /auth/student/refresh",
    c.post("/auth/student/refresh", json={"refresh_token": student_refresh}),
    200,
)
student_token = sref.get("access_token", student_token)
student_refresh = sref.get("refresh_token", student_refresh)
sh = {"Authorization": f"Bearer {student_token}"}

# ---------------------------------------------------------------------------
# Classes — Student Enrollment
# ---------------------------------------------------------------------------
section("Classes — Student Enrollment")

student_id = sreg.get("id")
if class_id and student_id:
    check(
        "POST /classes/{id}/students (enroll)",
        c.post(f"/classes/{class_id}/students", headers=th, json={"student_id": student_id}),
        201,
    )
    check("GET /classes/{id}/students", c.get(f"/classes/{class_id}/students", headers=th), 200)

# ---------------------------------------------------------------------------
# Student Portal
# ---------------------------------------------------------------------------
section("Student Portal")

check("GET /student/classes", c.get("/student/classes", headers=sh), 200)

if class_id:
    check("GET /student/classes/{id}", c.get(f"/student/classes/{class_id}", headers=sh), 200)
    check(
        "GET /student/classes/{id}/courses",
        c.get(f"/student/classes/{class_id}/courses", headers=sh),
        200,
    )

# Student cannot access class they're not enrolled in
check(
    "GET /student/classes/{id} (not enrolled)",
    c.get("/student/classes/nonexistent-class-id", headers=sh),
    403,
)

# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
section("Logout")

check(
    "POST /auth/teacher/logout",
    c.post("/auth/teacher/logout", json={"refresh_token": teacher_refresh}),
    200,
)
check(
    "POST /auth/student/logout",
    c.post("/auth/student/logout", json={"refresh_token": student_refresh}),
    200,
)

# Token should be invalid after logout
check(
    "POST /auth/teacher/refresh (after logout — should fail)",
    c.post("/auth/teacher/refresh", json={"refresh_token": teacher_refresh}),
    401,
)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print(f"\n{'='*50}")
if errors:
    print(f"FAILED -- {len(errors)} error(s):")
    for e in errors:
        print(f"  * {e}")
    sys.exit(1)
else:
    print("ALL PASSED")
