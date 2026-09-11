from fastapi import UploadFile, HTTPException, status
from core.config import settings

# Magic byte signatures for supported file formats
PDF_MAGIC = b"%PDF-"
DOCX_MAGIC = b"PK\x03\x04"


async def validate_upload_file(
    file: UploadFile,
    max_size_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES
) -> bytes:
    """
    Validates an incoming uploaded resume file:
    1. Extension verification (.pdf, .docx, .txt).
    2. File size constraints (<= 10MB, > 0 bytes).
    3. Magic byte signature verification to prevent spoofed/executable files.

    Returns:
        bytes: The verified raw file bytes.

    Raises:
        HTTPException(400): If file type is unsupported, empty, or fails signature check.
        HTTPException(413): If file exceeds maximum allowed size limit.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # 1. Extension Verification
    filename_lower = file.filename.lower()
    matched_ext = None
    for ext in settings.ALLOWED_EXTENSIONS:
        if filename_lower.endswith(ext):
            matched_ext = ext
            break

    if not matched_ext:
        allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format for '{file.filename}'. Allowed formats: {allowed}"
        )

    # 2. Read and Size Verification
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{file.filename}' is empty."
        )

    if file_size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        actual_mb = file_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File '{file.filename}' ({actual_mb:.2f}MB) exceeds the maximum upload limit of {max_mb:.0f}MB."
        )

    # 3. Magic Byte & Header Verification
    if matched_ext == ".pdf":
        if not content.startswith(PDF_MAGIC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' has a .pdf extension but lacks a valid PDF header signature."
            )
    elif matched_ext == ".docx":
        if not content.startswith(DOCX_MAGIC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' has a .docx extension but lacks a valid DOCX/ZIP header signature."
            )
    elif matched_ext == ".txt":
        # Ensure it's not a binary executable masquerading as a txt file
        sample = content[:1024]
        if b"\x00" in sample:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' contains binary null bytes and is not valid plain text."
            )

    return content
