import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_user_id
from app.models.db_models import Attachment, DailyEntry
from app.schemas.attachment import PresignRequest, PresignResponse, ConfirmRequest, AttachmentResponse
from app.services import storage_service

router = APIRouter(prefix="/attachments", tags=["attachments"])


@router.post("/presign", response_model=PresignResponse)
async def presign_upload(
    payload: PresignRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Verify entry belongs to user
    entry_result = await db.execute(
        select(DailyEntry).where(
            DailyEntry.id == payload.entry_id,
            DailyEntry.user_id == UUID(user_id),
        )
    )
    if not entry_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Entry not found")

    attachment_id = uuid.uuid4()
    ext = payload.file_name.rsplit(".", 1)[-1] if "." in payload.file_name else "bin"
    storage_path = f"{user_id}/{payload.entry_id}/{attachment_id}.{ext}"

    try:
        upload_url = await storage_service.create_signed_upload_url(storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "STORAGE_ERROR", "message": str(e)},
        )

    # Pre-create attachment record (unconfirmed)
    attachment = Attachment(
        id=attachment_id,
        user_id=UUID(user_id),
        daily_entry_id=payload.entry_id,
        section=payload.section,
        file_name=payload.file_name,
        mime_type=payload.mime_type,
        file_size_bytes=payload.file_size_bytes,
        storage_path=storage_path,
    )
    db.add(attachment)
    await db.commit()

    return PresignResponse(
        upload_url=upload_url,
        storage_path=storage_path,
        attachment_id=attachment_id,
    )


@router.post("/confirm", response_model=AttachmentResponse)
async def confirm_upload(
    payload: ConfirmRequest,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == payload.attachment_id,
            Attachment.user_id == UUID(user_id),
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Verify the file actually landed in storage before confirming
    file_exists = await storage_service.file_exists(attachment.storage_path)
    if not file_exists:
        # Clean up the dangling DB record
        await db.delete(attachment)
        await db.commit()
        raise HTTPException(status_code=400, detail="Upload not found in storage. Please try uploading again.")

    signed_url = await storage_service.create_signed_download_url(attachment.storage_path)
    response = AttachmentResponse.model_validate(attachment)
    response.signed_url = signed_url
    return response


@router.get("/{entry_id}", response_model=list[AttachmentResponse])
async def list_attachments(
    entry_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.daily_entry_id == entry_id,
            Attachment.user_id == UUID(user_id),
        ).order_by(Attachment.created_at)
    )
    attachments = result.scalars().all()

    responses = []
    for att in attachments:
        signed_url = await storage_service.create_signed_download_url(att.storage_path)
        r = AttachmentResponse.model_validate(att)
        r.signed_url = signed_url
        responses.append(r)

    return responses


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attachment(
    attachment_id: UUID,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id,
            Attachment.user_id == UUID(user_id),
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    try:
        await storage_service.delete_file(attachment.storage_path)
    except Exception:
        pass  # File may already be gone

    await db.delete(attachment)
    await db.commit()
