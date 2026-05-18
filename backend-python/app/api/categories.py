"""Categories API — CRUD for content categories (Chủ đề / Danh mục)."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import Prisma, get_prisma
from app.dependencies.auth import CurrentUser, require_permission
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from prisma.types import CategoryUpdateInput, CategoryWhereInput

router = APIRouter(prefix="/categories", tags=["categories"])

CategoryReader = Annotated[CurrentUser, Depends(require_permission("category:read"))]
CategoryCreator = Annotated[CurrentUser, Depends(require_permission("category:create"))]
CategoryEditor = Annotated[CurrentUser, Depends(require_permission("category:update"))]
CategoryDeleter = Annotated[CurrentUser, Depends(require_permission("category:delete"))]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _category_to_response(cat: object) -> CategoryResponse:
    course_count = len(cat.courses) if cat.courses is not None else 0  # type: ignore[attr-defined]
    exam_count = len(cat.exams) if cat.exams is not None else 0  # type: ignore[attr-defined]
    classroom_count = len(cat.classrooms) if cat.classrooms is not None else 0  # type: ignore[attr-defined]
    return CategoryResponse(
        id=cat.id,  # type: ignore[attr-defined]
        name=cat.name,  # type: ignore[attr-defined]
        description=cat.description,  # type: ignore[attr-defined]
        color=cat.color,  # type: ignore[attr-defined]
        icon=cat.icon,  # type: ignore[attr-defined]
        created_at=cat.created_at,  # type: ignore[attr-defined]
        updated_at=cat.updated_at,  # type: ignore[attr-defined]
        course_count=course_count,
        exam_count=exam_count,
        classroom_count=classroom_count,
    )


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    _: CategoryReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
    search: Optional[str] = None,
) -> list[CategoryResponse]:
    where: CategoryWhereInput = {}
    if search:
        where["name"] = {"contains": search, "mode": "insensitive"}
    categories = await prisma.category.find_many(
        where=where,
        include={"courses": True, "exams": True, "classrooms": True},
        order={"name": "asc"},
    )
    return [_category_to_response(cat) for cat in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    _: CategoryCreator,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CategoryResponse:
    cat = await prisma.category.create(
        data={
            "name": data.name,
            "description": data.description,
            "color": data.color,
            "icon": data.icon,
        },
        include={"courses": True, "exams": True, "classrooms": True},
    )
    return _category_to_response(cat)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    _: CategoryReader,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CategoryResponse:
    cat = await prisma.category.find_unique(
        where={"id": category_id},
        include={"courses": True, "exams": True, "classrooms": True},
    )
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return _category_to_response(cat)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    _: CategoryEditor,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> CategoryResponse:
    cat = await prisma.category.find_unique(where={"id": category_id})
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data: CategoryUpdateInput = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.color is not None:
        update_data["color"] = data.color
    if data.icon is not None:
        update_data["icon"] = data.icon

    updated = await prisma.category.update(
        where={"id": category_id},
        data=update_data,
        include={"courses": True, "exams": True, "classrooms": True},
    )
    return _category_to_response(updated)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    _: CategoryDeleter,
    prisma: Annotated[Prisma, Depends(get_prisma)],
) -> None:
    cat = await prisma.category.find_unique(where={"id": category_id})
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await prisma.category.delete(where={"id": category_id})
