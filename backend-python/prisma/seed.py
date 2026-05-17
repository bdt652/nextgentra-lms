"""
Seed script: upsert all permissions, default roles, and default admin teacher.
Run: python prisma/seed.py

Environment variables (optional overrides):
  ADMIN_EMAIL    — default admin teacher email (default: admin@nextgentra.com)
  ADMIN_PASSWORD — default admin teacher password (default: Admin@123456)
  ADMIN_NAME     — default admin teacher name (default: Administrator)
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.auth import get_password_hash
from prisma import Prisma

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@nextgentra.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123456")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administrator")

ALL_PERMISSIONS = [
    # Admin
    "admin:access",
    # Categories
    "category:create",
    "category:read",
    "category:update",
    "category:delete",
    # Courses
    "course:create",
    "course:read",
    "course:update",
    "course:delete",
    # Lessons
    "lesson:create",
    "lesson:read",
    "lesson:update",
    "lesson:delete",
    # Exams
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    # Classes
    "class:create",
    "class:read",
    "class:update",
    "class:delete",
    "class:manage_students",
    "class:manage_courses",
]

DEFAULT_ROLES = [
    {
        "name": "admin",
        "description": "Full administrative access",
        "permissions": ALL_PERMISSIONS,
    },
    {
        "name": "teacher",
        "description": "Can manage own courses, exams, and classes",
        "permissions": [
            "category:read",
            "course:create",
            "course:read",
            "course:update",
            "course:delete",
            "lesson:create",
            "lesson:read",
            "lesson:update",
            "lesson:delete",
            "exam:create",
            "exam:read",
            "exam:update",
            "exam:delete",
            "class:create",
            "class:read",
            "class:update",
            "class:delete",
            "class:manage_students",
            "class:manage_courses",
        ],
    },
]


async def seed() -> None:
    db = Prisma()
    await db.connect()

    print("Seeding permissions...")
    permission_map: dict[str, str] = {}
    for perm_name in ALL_PERMISSIONS:
        perm = await db.permission.upsert(
            where={"name": perm_name},
            data={
                "create": {"name": perm_name},
                "update": {},
            },
        )
        permission_map[perm_name] = perm.id
        print(f"  OK {perm_name}")

    print("\nSeeding roles...")
    for role_def in DEFAULT_ROLES:
        role = await db.role.upsert(
            where={"name": role_def["name"]},
            data={
                "create": {
                    "name": role_def["name"],
                    "description": role_def["description"],
                    "permissions": {
                        "connect": [{"id": permission_map[p]} for p in role_def["permissions"]]
                    },
                },
                "update": {
                    "description": role_def["description"],
                    "permissions": {
                        "set": [{"id": permission_map[p]} for p in role_def["permissions"]]
                    },
                },
            },
        )
        print(f"  OK {role.name} ({len(role_def['permissions'])} permissions)")

    print("\nSeeding default admin teacher...")
    admin_role = await db.role.find_unique(where={"name": "admin"})
    if not admin_role:
        print("  ✗ Admin role not found — skipping teacher creation")
    else:
        existing = await db.teacher.find_unique(where={"email": ADMIN_EMAIL})
        if existing:
            print(f"  ~ {ADMIN_EMAIL} already exists, skipping")
        else:
            await db.teacher.create(
                data={
                    "email": ADMIN_EMAIL,
                    "name": ADMIN_NAME,
                    "hashed_password": get_password_hash(ADMIN_PASSWORD),
                    "role": {"connect": {"id": admin_role.id}},
                }
            )
            print(f"  OK Created admin teacher: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")

    await db.disconnect()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(seed())
