"""
Scaffold: Service Layer Template

Use this template for business logic layer.
"""

from typing import Optional, List
from prisma import Prisma
from ...schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
)


class ResourceService:
    """
    Service layer for resource business logic.

    This layer contains:
    - Business rules
    - Data validation
    - Transaction management
    - Complex queries
    """

    @staticmethod
    async def list_resources(
        skip: int,
        limit: int,
        status: Optional[str],
        user
    ) -> List[ResourceResponse]:
        """
        List resources with optional filtering.

        Args:
            skip: Pagination offset
            limit: Items per page
            status: Optional status filter
            user: Current user (for permission checks)

        Returns:
            List of resources
        """
        db = Prisma()
        await db.connect()
        try:
            # Build where clause
            where = {}
            if status:
                where["status"] = status

            # Example: Only show user's own resources (if not admin)
            # if user.role != "ADMIN":
            #     where["created_by"] = user.id

            resources = await db.resource.find_many(
                where=where,
                include={
                    "creator": {
                        "select": {"id": True, "name": True, "email": True}
                    }
                },
                skip=skip,
                take=limit,
                order={"created_at": "desc"}
            )
            return resources
        finally:
            await db.disconnect()

    @staticmethod
    async def get_resource(id: str) -> Optional[ResourceResponse]:
        """Get single resource by ID"""
        db = Prisma()
        await db.connect()
        try:
            return await db.resource.find_unique(
                where={"id": id},
                include={"creator": True}
            )
        finally:
            await db.disconnect()

    @staticmethod
    async def create_resource(
        data: ResourceCreate,
        created_by: str
    ) -> ResourceResponse:
        """
        Create new resource.

        Args:
            data: Creation data
            created_by: User ID creating the resource

        Returns:
            Created resource

        Raises:
            ValueError: If validation fails
        """
        db = Prisma()
        await db.connect()
        try:
            # Business logic example: Check if user can create
            # user = await db.user.find_unique(where={"id": created_by})
            # if not user or user.role not in ["TEACHER", "ADMIN"]:
            #     raise ValueError("Insufficient permissions")

            resource = await db.resource.create(
                data={
                    **data.model_dump(),
                    "created_by": created_by,
                },
                include={"creator": True}
            )
            return resource
        finally:
            await db.disconnect()

    @staticmethod
    async def update_resource(
        id: str,
        data: ResourceUpdate,
        user_id: str
    ) -> ResourceResponse:
        """
        Update existing resource.

        Args:
            id: Resource ID
            data: Update data
            user_id: User making the update

        Returns:
            Updated resource

        Raises:
            HTTPException: 404 if not found
            HTTPException: 403 if not authorized
        """
        db = Prisma()
        await db.connect()
        try:
            # Check ownership
            existing = await db.resource.find_unique(where={"id": id})
            if not existing:
                raise ValueError("Resource not found")

            # if existing.created_by != user_id and user.role != "ADMIN":
            #     raise ValueError("Not authorized to update this resource")

            resource = await db.resource.update(
                where={"id": id},
                data=data.model_dump(exclude_unset=True),
                include={"creator": True}
            )
            return resource
        finally:
            await db.disconnect()

    @staticmethod
    async def delete_resource(id: str, user_id: str) -> None:
        """
        Delete resource.

        Args:
            id: Resource ID
            user_id: User making the deletion

        Raises:
            ValueError: If not found or not authorized
        """
        db = Prisma()
        await db.connect()
        try:
            existing = await db.resource.find_unique(where={"id": id})
            if not existing:
                raise ValueError("Resource not found")

            # Check permissions
            # if existing.created_by != user_id and user.role != "ADMIN":
            #     raise ValueError("Not authorized to delete this resource")

            await db.resource.delete(where={"id": id})
        finally:
            await db.disconnect()
