"""
TradeOS File Storage Service
=============================
Handles file uploads, downloads, and management using Emergent Object Storage.

Features:
- File uploads (images, documents, PDFs, etc.)
- Organization-scoped storage paths
- Soft-delete support
- Content-type validation
- Supabase metadata storage

Storage Path Convention:
  tradeos/{organization_id}/uploads/{category}/{uuid}.{ext}

Categories:
- documents: Tender documents, specs, contracts
- drawings: CAD files, blueprints, plans  
- photos: Site photos, progress images
- receipts: Expense receipts
- avatars: Profile pictures
- general: Other files
"""

from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import logging
import requests
import httpx
from datetime import datetime, timezone

router = APIRouter(prefix="/api/storage", tags=["storage"])
logger = logging.getLogger(__name__)

# Emergent Object Storage configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "tradeos"

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Module-level storage key (initialized once at startup)
storage_key = None

# Allowed file types and their MIME types
ALLOWED_MIME_TYPES = {
    # Images
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "heic": "image/heic",
    "heif": "image/heif",
    # Documents
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "csv": "text/csv",
    "txt": "text/plain",
    # CAD/Drawings
    "dwg": "application/acad",
    "dxf": "application/dxf",
    # Archives
    "zip": "application/zip",
}

# Max file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# File categories
VALID_CATEGORIES = ["documents", "drawings", "photos", "receipts", "avatars", "general"]


# Pydantic models
class FileMetadata(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str
    size: int
    category: str
    organization_id: Optional[str] = None
    user_id: Optional[str] = None
    description: Optional[str] = None
    is_deleted: bool = False
    created_at: str
    updated_at: Optional[str] = None


class FileUploadResponse(BaseModel):
    success: bool
    file_id: str
    storage_path: str
    original_filename: str
    size: int
    content_type: str
    download_url: str


class FileListResponse(BaseModel):
    files: List[FileMetadata]
    total: int


# Storage initialization
def init_storage():
    """Initialize storage and get session-scoped storage key. Call once at startup."""
    global storage_key
    
    if storage_key:
        return storage_key
    
    if not EMERGENT_KEY:
        logger.error("EMERGENT_LLM_KEY not configured")
        raise Exception("Storage not configured: Missing EMERGENT_LLM_KEY")
    
    try:
        resp = requests.post(
            f"{STORAGE_URL}/init",
            json={"emergent_key": EMERGENT_KEY},
            timeout=30
        )
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Emergent Object Storage initialized successfully")
        return storage_key
    except requests.RequestException as e:
        logger.error(f"Failed to initialize storage: {e}")
        raise Exception(f"Storage initialization failed: {e}")


def ensure_storage_key():
    """Ensure storage key is available, re-initializing if needed."""
    global storage_key
    if not storage_key:
        init_storage()
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload a file to storage."""
    key = ensure_storage_key()
    
    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={
                "X-Storage-Key": key,
                "Content-Type": content_type
            },
            data=data,
            timeout=120
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.error(f"Failed to upload file: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


def get_object(path: str) -> tuple:
    """Download a file from storage. Returns (content_bytes, content_type)."""
    key = ensure_storage_key()
    
    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60
        )
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")
    except requests.RequestException as e:
        logger.error(f"Failed to download file: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {e}")


async def get_supabase_headers():
    """Get headers for Supabase service role requests."""
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    if "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    return "bin"


def validate_file(file: UploadFile, content: bytes):
    """Validate file type and size."""
    ext = get_file_extension(file.filename)
    
    if ext not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not allowed. Allowed types: {', '.join(ALLOWED_MIME_TYPES.keys())}"
        )
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    return ext


# API Endpoints

@router.get("/health")
async def storage_health():
    """Check storage service health."""
    try:
        key = ensure_storage_key()
        return {
            "status": "healthy",
            "service": "storage",
            "storage_initialized": key is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "storage",
            "error": str(e)
        }


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Query("general", description="File category"),
    organization_id: Optional[str] = Query(None, description="Organization ID"),
    user_id: Optional[str] = Query(None, description="User ID"),
    description: Optional[str] = Query(None, description="File description"),
    authorization: str = Header(...)
):
    """
    Upload a file to TradeOS storage.
    
    Categories: documents, drawings, photos, receipts, avatars, general
    """
    # Validate category
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Valid categories: {', '.join(VALID_CATEGORIES)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file
    ext = validate_file(file, content)
    
    # Generate storage path
    file_id = str(uuid.uuid4())
    org_path = organization_id or "shared"
    storage_path = f"{APP_NAME}/{org_path}/uploads/{category}/{file_id}.{ext}"
    
    # Determine content type
    content_type = file.content_type or ALLOWED_MIME_TYPES.get(ext, "application/octet-stream")
    
    # Upload to Emergent Storage
    result = put_object(storage_path, content, content_type)
    
    # Store metadata in Supabase
    file_metadata = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result["size"],
        "category": category,
        "organization_id": organization_id,
        "user_id": user_id,
        "description": description,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/files",
                headers=headers,
                json=file_metadata
            )
            
            if response.status_code not in [200, 201]:
                # Table might not exist yet - log but don't fail
                logger.warning(f"Could not store file metadata in Supabase: {response.text}")
    except Exception as e:
        logger.warning(f"Could not store file metadata: {e}")
    
    return {
        "success": True,
        "file_id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "size": result["size"],
        "content_type": content_type,
        "download_url": f"/api/storage/files/{file_id}"
    }


@router.get("/files/{file_id}")
async def download_file(
    file_id: str,
    authorization: Optional[str] = Header(None),
    auth: Optional[str] = Query(None)
):
    """
    Download a file by ID.
    
    Supports both header-based auth and query param auth (for <img src>).
    """
    # Auth can come from header or query param
    auth_token = authorization or (f"Bearer {auth}" if auth else None)
    
    if not auth_token:
        raise HTTPException(status_code=401, detail="Authorization required")
    
    # Look up file metadata in Supabase
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/files?id=eq.{file_id}&is_deleted=eq.false&select=*",
                headers=headers
            )
            
            if response.status_code == 200:
                files = response.json()
                if files and len(files) > 0:
                    file_record = files[0]
                    storage_path = file_record["storage_path"]
                    content_type = file_record.get("content_type", "application/octet-stream")
                    original_filename = file_record.get("original_filename", "file")
                    
                    # Download from storage
                    content, _ = get_object(storage_path)
                    
                    return Response(
                        content=content,
                        media_type=content_type,
                        headers={
                            "Content-Disposition": f'inline; filename="{original_filename}"'
                        }
                    )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Could not find file in Supabase: {e}")
    
    # Fallback: try direct path lookup if ID looks like a path
    if "/" in file_id:
        try:
            content, content_type = get_object(file_id)
            return Response(content=content, media_type=content_type)
        except Exception:
            pass
    
    raise HTTPException(status_code=404, detail="File not found")


@router.get("/files", response_model=FileListResponse)
async def list_files(
    category: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    authorization: str = Header(...)
):
    """
    List files with optional filtering by category and organization.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            
            # Build query
            query_parts = ["is_deleted=eq.false"]
            if category:
                query_parts.append(f"category=eq.{category}")
            if organization_id:
                query_parts.append(f"organization_id=eq.{organization_id}")
            
            query_string = "&".join(query_parts)
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/files?{query_string}&order=created_at.desc&limit={limit}&offset={offset}&select=*",
                headers=headers
            )
            
            if response.status_code == 200:
                files = response.json()
                return {
                    "files": files,
                    "total": len(files)
                }
            else:
                return {"files": [], "total": 0}
                
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        return {"files": [], "total": 0}


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    authorization: str = Header(...)
):
    """
    Soft-delete a file (marks as deleted but doesn't remove from storage).
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_supabase_headers()
            
            # Soft delete by setting is_deleted = true
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/files?id=eq.{file_id}",
                headers=headers,
                json={
                    "is_deleted": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            )
            
            if response.status_code in [200, 204]:
                return {"success": True, "message": "File deleted"}
            else:
                raise HTTPException(status_code=404, detail="File not found")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Initialize storage on module load
try:
    init_storage()
except Exception as e:
    logger.warning(f"Storage initialization deferred: {e}")
