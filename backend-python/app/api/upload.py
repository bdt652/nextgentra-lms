"""File upload endpoint — proxies multipart uploads to MinIO."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.storage import upload_file
from app.dependencies.auth import CurrentUser, get_current_teacher

router = APIRouter(prefix="/upload", tags=["upload"])

UploadAuth = Annotated[CurrentUser, Depends(get_current_teacher)]


class UploadResponse(BaseModel):
    url: str
    file_type: str


@router.post("", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload(
    file: UploadFile,
    _current_user: UploadAuth,
    folder: str = "attachments",
) -> UploadResponse:
    """Upload a file to MinIO. Query param folder must be 'covers' or 'attachments'."""
    if folder not in {"covers", "attachments"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="folder phải là 'covers' hoặc 'attachments'",
        )
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có file được gửi lên",
        )

    try:
        url, file_type = await upload_file(file, folder)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return UploadResponse(url=url, file_type=file_type)
