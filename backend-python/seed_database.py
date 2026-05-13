"""Database seeder for initial data."""

import asyncio

from app.core.database import connect_db, disconnect_db, get_prisma


async def seed_database():
    """Seed database with initial required data."""
    await connect_db()
    prisma = get_prisma()

    try:
        print("Seeding database...")

        # Seed permissions
        permissions_data = [
            {"name": "admin:access"},
            {"name": "course:create"},
            {"name": "course:edit"},
            {"name": "course:delete"},
            {"name": "assignment:grade"},
            {"name": "assignment:create"},
            {"name": "assignment:edit"},
            {"name": "student:view"},
            {"name": "teacher:manage"},
        ]

        created_permissions = {}
        for perm_data in permissions_data:
            permission = await prisma.permission.upsert(
                where={"name": perm_data["name"]},
                data={
                    "create": perm_data,
                    "update": perm_data,
                },
            )
            created_permissions[permission.name] = permission
            print(f"  ✓ Permission: {permission.name}")

        # Seed roles
        roles_data = [
            {
                "name": "admin",
                "description": "Administrator with full access",
                "permission_ids": [p.id for p in created_permissions.values()],
            },
            {
                "name": "teacher",
                "description": "Teacher with basic course and assignment management",
                "permission_ids": [
                    created_permissions["course:create"].id,
                    created_permissions["course:edit"].id,
                    created_permissions["assignment:create"].id,
                    created_permissions["assignment:grade"].id,
                    created_permissions["student:view"].id,
                ],
            },
        ]

        for role_data in roles_data:
            role = await prisma.role.upsert(
                where={"name": role_data["name"]},
                data={
                    "create": {
                        "name": role_data["name"],
                        "description": role_data["description"],
                        "permissions": {
                            "connect": [{"id": pid} for pid in role_data["permission_ids"]]
                        },
                    },
                    "update": {
                        "description": role_data["description"],
                        "permissions": {
                            "set": [{"id": pid} for pid in role_data["permission_ids"]]
                        },
                    },
                },
            )
            print(f"  ✓ Role: {role.name} (with {len(role_data['permission_ids'])} permissions)")

        print("\n✅ Database seeded successfully!")
        print(f"   Total permissions: {len(created_permissions)}")
        print(f"   Total roles: {len(roles_data)}")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(seed_database())
