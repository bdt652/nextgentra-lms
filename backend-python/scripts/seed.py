#!/usr/bin/env python3
"""Initialize database with default roles and permissions."""

import asyncio
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from prisma import Prisma


async def main() -> None:
    """Seed the database with initial RBAC data."""
    prisma = Prisma()
    await prisma.connect()

    print("Seeding database...")

    # Create permissions
    permissions_data = [
        {"name": "course:create"},
        {"name": "course:read"},
        {"name": "course:update"},
        {"name": "course:delete"},
        {"name": "assignment:create"},
        {"name": "assignment:read"},
        {"name": "assignment:update"},
        {"name": "assignment:delete"},
        {"name": "assignment:grade"},
        {"name": "submission:create"},
        {"name": "submission:read"},
        {"name": "submission:update"},
        {"name": "user:read"},
        {"name": "user:create"},
        {"name": "user:update"},
        {"name": "user:delete"},
        {"name": "role:read"},
        {"name": "role:create"},
        {"name": "role:update"},
        {"name": "role:delete"},
        {"name": "admin:access"},  # grants access to admin panel
    ]

    print("Creating permissions...")
    created_permissions = {}
    for perm in permissions_data:
        # Check if permission exists, if not create it
        existing = await prisma.permission.find_unique(where={"name": perm["name"]})
        if existing:
            p = existing
        else:
            p = await prisma.permission.create(data=perm)
        created_permissions[p.name] = p
        print(f"  [OK] Permission: {p.name}")

    # Create roles with permissions
    print("\nCreating roles...")

    # Student role - minimal permissions (none for now, can add later)
    student_role = await prisma.role.find_unique(where={"name": "student"})
    if not student_role:
        student_role = await prisma.role.create(
            data={
                "name": "student",
                "description": "Student role - read-only access to own courses and assignments",
            }
        )
    print("  [OK] Role: student (no permissions)")

    # Teacher role - can manage own courses, assignments, submissions
    teacher_permission_names = [
        "course:create",
        "course:read",
        "course:update",
        "course:delete",
        "assignment:create",
        "assignment:read",
        "assignment:update",
        "assignment:delete",
        "assignment:grade",
        "submission:read",
        "submission:update",
    ]
    teacher_perms = [created_permissions[name] for name in teacher_permission_names]
    teacher_role = await prisma.role.find_unique(where={"name": "teacher"})
    if teacher_role:
        # Update permissions if role exists
        await prisma.role.update(
            where={"id": teacher_role.id},
            data={
                "description": "Teacher role - full access to courses, assignments, grading",
                "permissions": {"connect": [{"id": p.id} for p in teacher_perms]},
            },
        )
    else:
        teacher_role = await prisma.role.create(
            data={
                "name": "teacher",
                "description": "Teacher role - full access to courses, assignments, grading",
                "permissions": {"connect": [{"id": p.id} for p in teacher_perms]},
            }
        )
    print(f"  [OK] Role: teacher ({len(teacher_perms)} permissions)")

    # Admin role - all permissions
    admin_perms = list(created_permissions.values())
    admin_role = await prisma.role.find_unique(where={"name": "admin"})
    if admin_role:
        # Update permissions if role exists
        await prisma.role.update(
            where={"id": admin_role.id},
            data={
                "description": "Administrator role - full system access",
                "permissions": {"connect": [{"id": p.id} for p in admin_perms]},
            },
        )
    else:
        admin_role = await prisma.role.create(
            data={
                "name": "admin",
                "description": "Administrator role - full system access",
                "permissions": {"connect": [{"id": p.id} for p in admin_perms]},
            }
        )
    print(f"  [OK] Role: admin ({len(admin_perms)} permissions)")

    # Create default admin teacher account (if doesn't exist)
    print("\nCreating default admin account...")
    admin_email = "admin@example.com"
    existing_admin = await prisma.teacher.find_unique(where={"email": admin_email})
    if not existing_admin:
        admin_role = await prisma.role.find_unique(where={"name": "admin"})
        if admin_role:
            hashed_password = get_password_hash("admin123")  # Change in production!
            await prisma.teacher.create(
                data={
                    "email": admin_email,
                    "name": "System Administrator",
                    "hashed_password": hashed_password,
                    "role": {"connect": {"id": admin_role.id}},
                }
            )
            print(f"  [OK] Admin account created: {admin_email} (password: admin123)")
            print("    ! CHANGE PASSWORD IMMEDIATELY IN PRODUCTION!")
    else:
        print(f"  [i] Admin account already exists: {admin_email}")

    await prisma.disconnect()
    print("\n[SUCCESS] Database seeded successfully!")


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    from passlib.context import CryptContext

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)


if __name__ == "__main__":
    asyncio.run(main())
