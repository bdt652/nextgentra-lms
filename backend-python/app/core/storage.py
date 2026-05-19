"""MinIO object storage utilities."""

import asyncio
from io import BytesIO
import re
import uuid

from fastapi import UploadFile
from minio import Minio

from app.core.database import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

_ALLOWED_COVER_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "text/plain",
    "application/zip",
}

_MIME_TO_FILE_TYPE: dict[str, str] = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "ppt",
    "application/vnd.ms-excel": "xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "video/mp4": "video",
    "video/webm": "video",
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "image/gif": "image",
}


def get_minio_client() -> Minio:
    return Minio(
        endpoint=settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=False,
    )


def _sanitize_filename(name: str) -> str:
    name = name.replace(" ", "_")
    name = re.sub(r"[^\w.\-]", "", name, flags=re.ASCII)
    return name[:100]


def _ensure_bucket(client: Minio, bucket: str) -> None:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
        policy = (
            '{"Version":"2012-10-17","Statement":[{'
            '"Effect":"Allow","Principal":"*",'
            f'"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::{bucket}/*"]'
            "}]}"
        )
        client.set_bucket_policy(bucket, policy)
        logger.info("Created MinIO bucket with public-read policy", bucket=bucket)


async def upload_file(file: UploadFile, folder: str) -> tuple[str, str]:
    """Upload a file to MinIO and return (public_url, file_type)."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File vượt quá giới hạn {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB")

    content_type = file.content_type or "application/octet-stream"

    if folder == "covers" and content_type not in _ALLOWED_COVER_TYPES:
        raise ValueError(f"Ảnh bìa phải là JPEG, PNG, WebP hoặc GIF. Nhận được: {content_type}")
    if folder == "attachments" and content_type not in _ALLOWED_ATTACHMENT_TYPES:
        raise ValueError(f"Loại file không được hỗ trợ: {content_type}")

    safe_name = _sanitize_filename(file.filename or "upload")
    object_name = f"{folder}/{uuid.uuid4()}_{safe_name}"

    def _do_upload() -> None:
        client = get_minio_client()
        _ensure_bucket(client, settings.minio_bucket)
        client.put_object(
            bucket_name=settings.minio_bucket,
            object_name=object_name,
            data=BytesIO(content),
            length=len(content),
            content_type=content_type,
        )

    await asyncio.to_thread(_do_upload)

    public_url = (
        f"{settings.minio_public_url.rstrip('/')}" f"/{settings.minio_bucket}/{object_name}"
    )
    file_type = _MIME_TO_FILE_TYPE.get(content_type, "other")

    logger.info("File uploaded to MinIO", object=object_name, size=len(content))
    return public_url, file_type
