# Backend Implementation Quick Reference

## Essential Code Snippets for Backend Development

### 1. Session Creation Endpoint

```python
# FastAPI Example
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/uploads")

@router.post("/session")
async def create_session(metadata: dict, ttl_hours: int = 24, client_id: int = None):
    """Create a new upload session"""
    try:
        session_id = f"sess_{client_id or 'anonymous'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}"
        
        created_at = datetime.now()
        expires_at = created_at + timedelta(hours=ttl_hours)
        
        # Insert into database
        db.execute(
            """
            INSERT INTO upload_session (session_id, client_id, metadata, created_at, expires_at, status, ttl_hours)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (session_id, client_id, json.dumps(metadata), created_at, expires_at, "active", ttl_hours)
        )
        db.commit()
        
        return {
            "session_id": session_id,
            "created_at": created_at.isoformat(),
            "expires_at": expires_at.isoformat(),
            "status": "active",
            "metadata": metadata,
            "file_count": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 2. File Upload Endpoint with Auto-Parsing

```python
from fastapi import UploadFile
import os
import hashlib
from parsers import BajajPOParser, DavaIndiaParser

@router.post("/session/{session_id}/files")
async def upload_file(
    session_id: str,
    file: UploadFile,
    uploaded_by: str = "unknown",
    po_number: str = None,
    auto_parse: bool = False
):
    """Upload file to session with optional auto-parsing"""
    try:
        # Validate session
        session = db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if datetime.fromisoformat(session['expires_at']) < datetime.now():
            raise HTTPException(status_code=400, detail="Session expired")
        
        # Validate file size (50MB)
        contents = await file.read()
        if len(contents) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large")
        
        # Save file
        file_id = str(uuid.uuid4())
        storage_filename = f"{file_id}_{file.filename}"
        storage_path = f"/uploads/{session_id}/{storage_filename}"
        
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        with open(storage_path, 'wb') as f:
            f.write(contents)
        
        # Calculate hashes
        file_hash = hashlib.sha256(contents).hexdigest()
        
        # Compress if applicable
        is_compressed = file.filename.endswith(('.xlsx', '.xls', '.csv'))
        compressed_size = None
        compressed_hash = None
        
        if is_compressed:
            compressed_contents = compress_file(contents)
            compressed_hash = hashlib.sha256(compressed_contents).hexdigest()
            compressed_size = len(compressed_contents)
            # Save compressed version
            compressed_path = f"{storage_path}.gz"
            with open(compressed_path, 'wb') as f:
                f.write(compressed_contents)
        
        # Auto-parse if enabled
        parse_status = "PENDING"
        parse_error = None
        parsed_po_id = None
        
        if auto_parse and session.get('client_id'):
            try:
                parser = select_parser(session['client_id'])
                if parser:
                    parsed_data = parser.parse(contents, file.filename)
                    
                    # Insert PO into database
                    po_id = db.insert_client_po({
                        "po_number": parsed_data['po_details']['po_number'],
                        "po_date": parsed_data['po_details']['po_date'],
                        "vendor_name": parsed_data['po_details']['vendor_name'],
                        "client_id": session['client_id'],
                        "po_value": parsed_data['po_details']['total'],
                        "status": "active"
                    })
                    parsed_po_id = po_id
                    parse_status = "SUCCESS"
            except Exception as e:
                parse_status = "FAILED"
                parse_error = str(e)
        
        # Insert file record
        db.execute(
            """
            INSERT INTO upload_file 
            (id, session_id, po_number, original_filename, storage_filename, storage_path, 
             file_size, compressed_size, is_compressed, mime_type, file_hash, compressed_hash,
             upload_timestamp, uploaded_by, status, parse_status, parse_error, po_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (file_id, session_id, po_number, file.filename, storage_filename, storage_path,
             len(contents), compressed_size, is_compressed, file.content_type, file_hash, 
             compressed_hash, datetime.now(), uploaded_by, "active", parse_status, parse_error, parsed_po_id)
        )
        db.commit()
        
        # Update session file count
        db.execute("UPDATE upload_session SET file_count = file_count + 1 WHERE session_id = %s", (session_id,))
        db.commit()
        
        return {
            "file_id": file_id,
            "session_id": session_id,
            "original_filename": file.filename,
            "file_size": len(contents),
            "compressed_size": compressed_size,
            "is_compressed": is_compressed,
            "mime_type": file.content_type,
            "file_hash": file_hash,
            "upload_timestamp": datetime.now().isoformat(),
            "parse_status": parse_status,
            "parse_error": parse_error,
            "po_id": parsed_po_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 3. Parser Selection Logic

```python
def select_parser(client_id: int):
    """Select parser based on client_id"""
    parsers = {
        1: BajajPOParser(),      # Bajaj
        2: DavaIndiaParser(),    # Dava India
    }
    return parsers.get(client_id)


class BajajPOParser:
    def parse(self, file_contents: bytes, filename: str) -> dict:
        """Parse Bajaj PO Excel file"""
        try:
            import openpyxl
            from io import BytesIO
            
            workbook = openpyxl.load_workbook(BytesIO(file_contents))
            sheet = workbook.active
            
            # Extract data from expected cell locations
            po_number = sheet['B2'].value
            po_date = sheet['B3'].value
            vendor_name = sheet['B4'].value
            
            # Calculate totals
            subtotal = sum(
                sheet[f'F{row}'].value or 0 
                for row in range(10, 50)
            )
            cgst_rate = 0.09  # 9% CGST
            sgst_rate = 0.09  # 9% SGST
            cgst = subtotal * cgst_rate
            sgst = subtotal * sgst_rate
            total = subtotal + cgst + sgst
            
            # Extract line items
            line_items = []
            for row in range(10, 50):
                if sheet[f'A{row}'].value:
                    line_items.append({
                        "item_name": sheet[f'A{row}'].value,
                        "quantity": sheet[f'C{row}'].value or 0,
                        "unit_price": sheet[f'D{row}'].value or 0,
                        "taxable_amount": sheet[f'E{row}'].value or 0,
                        "gross_amount": sheet[f'F{row}'].value or 0
                    })
            
            return {
                "po_details": {
                    "po_number": po_number,
                    "po_date": po_date,
                    "vendor_name": vendor_name,
                    "subtotal": subtotal,
                    "cgst": cgst,
                    "sgst": sgst,
                    "igst": 0,
                    "total": total
                },
                "line_items": line_items
            }
        except Exception as e:
            raise ValueError(f"Failed to parse Bajaj PO: {str(e)}")
```

### 4. File Download Endpoint

```python
from fastapi.responses import FileResponse

@router.get("/session/{session_id}/files/{file_id}/download")
async def download_file(session_id: str, file_id: str):
    """Download file from session"""
    try:
        # Validate session and file
        file_record = db.get_file(file_id, session_id)
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        
        storage_path = file_record['storage_path']
        if not os.path.exists(storage_path):
            raise HTTPException(status_code=404, detail="File not found on storage")
        
        # Return file
        return FileResponse(
            path=storage_path,
            filename=file_record['original_filename'],
            media_type=file_record['mime_type']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 5. Session Cleanup Job

```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

def cleanup_expired_sessions():
    """Delete expired sessions and their files"""
    try:
        # Find expired sessions
        expired_sessions = db.execute(
            "SELECT session_id, uploads_path FROM upload_session WHERE expires_at < NOW()"
        ).fetchall()
        
        for session in expired_sessions:
            session_id, uploads_path = session
            
            # Delete files from storage
            if os.path.exists(uploads_path):
                shutil.rmtree(uploads_path)
            
            # Delete from database
            db.execute("DELETE FROM upload_file WHERE session_id = %s", (session_id,))
            db.execute("DELETE FROM upload_session WHERE session_id = %s", (session_id,))
            db.commit()
            
            print(f"Cleaned up expired session: {session_id}")
    except Exception as e:
        print(f"Cleanup job failed: {str(e)}")

# Schedule cleanup job
scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_expired_sessions, 'interval', hours=6)
scheduler.start()
```

### 6. Database Helper Functions

```python
class DatabaseHelper:
    def __init__(self, connection):
        self.conn = connection
    
    def get_session(self, session_id: str) -> dict:
        """Get session by ID"""
        result = self.conn.execute(
            "SELECT * FROM upload_session WHERE session_id = %s",
            (session_id,)
        ).fetchone()
        return result
    
    def get_file(self, file_id: str, session_id: str) -> dict:
        """Get file by ID and session"""
        result = self.conn.execute(
            "SELECT * FROM upload_file WHERE id = %s AND session_id = %s",
            (file_id, session_id)
        ).fetchone()
        return result
    
    def list_files(self, session_id: str, skip: int = 0, limit: int = 50) -> list:
        """List files in session"""
        results = self.conn.execute(
            "SELECT * FROM upload_file WHERE session_id = %s ORDER BY upload_timestamp DESC LIMIT %s OFFSET %s",
            (session_id, limit, skip)
        ).fetchall()
        return results
    
    def get_session_stats(self, session_id: str) -> dict:
        """Get session statistics"""
        result = self.conn.execute(
            """
            SELECT 
                COUNT(*) as total_files,
                SUM(file_size) as total_size_bytes,
                COUNT(CASE WHEN status='downloaded' THEN 1 END) as total_downloads
            FROM upload_file 
            WHERE session_id = %s
            """,
            (session_id,)
        ).fetchone()
        return result
    
    def delete_session(self, session_id: str):
        """Delete session and files"""
        self.conn.execute("DELETE FROM upload_file WHERE session_id = %s", (session_id,))
        self.conn.execute("DELETE FROM upload_session WHERE session_id = %s", (session_id,))
        self.conn.commit()
```

### 7. Error Response Format

```python
# Standard error response
{
    "status": "ERROR",
    "error_code": "HTTP_ERROR_CODE",
    "message": "Human readable error message",
    "path": "/api/uploads/session/xyz/files/abc",
    "timestamp": "2026-02-17T10:30:45.123456",
    "errors": [
        {
            "field": "file",
            "message": "File exceeds maximum size of 50MB",
            "type": "VALIDATION_ERROR"
        }
    ]
}
```

### 8. Compression Helper

```python
import gzip
import io

def compress_file(file_contents: bytes) -> bytes:
    """Compress file contents with gzip"""
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode='wb') as f:
        f.write(file_contents)
    return buf.getvalue()

def decompress_file(compressed_contents: bytes) -> bytes:
    """Decompress gzip file"""
    with gzip.GzipFile(fileobj=io.BytesIO(compressed_contents)) as f:
        return f.read()
```

### 9. Authentication Middleware

```python
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token"""
    try:
        token = credentials.credentials
        # Decode and validate token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/session", dependencies=[Depends(verify_token)])
async def create_session(...):
    # Protected endpoint
    pass
```

### 10. Integration Testing Example

```python
import pytest
from fastapi.testclient import TestClient

client = TestClient(app)

def test_create_session():
    response = client.post(
        "/api/uploads/session",
        json={
            "metadata": {"project": "Test"},
            "ttl_hours": 24,
            "client_id": 1
        }
    )
    assert response.status_code == 200
    assert "session_id" in response.json()

def test_upload_file():
    # Create session first
    session_resp = client.post(
        "/api/uploads/session",
        json={"metadata": {"project": "Test"}, "ttl_hours": 24}
    )
    session_id = session_resp.json()["session_id"]
    
    # Upload file
    with open("test_po.xlsx", "rb") as f:
        response = client.post(
            f"/api/uploads/session/{session_id}/files",
            files={"file": f},
            data={"uploaded_by": "admin", "auto_parse": "true"}
        )
    
    assert response.status_code == 200
    assert response.json()["parse_status"] == "SUCCESS"
```

---

## Important Notes

1. **Database Migrations**: Use Alembic or similar for version control
2. **File Storage**: Consider S3/Azure Blob for production
3. **Logging**: Implement comprehensive logging for debugging
4. **Monitoring**: Set up alerts for failures and performance issues
5. **Testing**: Write tests for all endpoints  before production
6. **Documentation**: Keep API docs updated with code changes
7. **Security**: Always validate and sanitize input
8. **Performance**: Index frequently queried fields
9. **Backups**: Regular backups of database and uploaded files
10. **Scaling**: Plan for horizontal scaling if needed

---

For complete documentation, refer to the integration guide files:
- FILE_UPLOAD_IMPLEMENTATION.md
- BACKEND_INTEGRATION_CHECKLIST.md
- SYSTEM_ARCHITECTURE.md
