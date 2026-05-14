#!/usr/bin/env python
"""Test database connection and Prisma client."""

import asyncio
import sys

from prisma import Prisma


async def test_connection():
    """Test database connection."""
    # Set UTF-8 encoding for Windows console
    if sys.platform == "win32":
        import io

        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    db = Prisma()
    try:
        await db.connect()
        print("[OK] Connected to PostgreSQL successfully!")

        # Test query - simple connection test
        await db.execute_raw("SELECT 1")
        print("[OK] Can query database")

        # Show table counts
        student_count = await db.student.count()
        teacher_count = await db.teacher.count()
        role_count = await db.role.count()
        permission_count = await db.permission.count()

        print("\n📊 Database Statistics:")
        print(f"   Students: {student_count}")
        print(f"   Teachers: {teacher_count}")
        print(f"   Roles: {role_count}")
        print(f"   Permissions: {permission_count}")

        print("\n✅ All checks passed! Database is ready.")

    except Exception as e:
        print(f"[ERROR] {e}")
        raise
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(test_connection())
