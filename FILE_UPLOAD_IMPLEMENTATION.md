# File Upload Integration Implementation Guide

## Overview

The file upload system has been integrated into your Calm Flow Ledger dashboard. It provides session-based file management with automatic PO parsing, file compression, and storage.

## What Was Integrated

### 1. **Types** (`src/types/index.ts`)
Added comprehensive TypeScript interfaces for:
- `UploadSession` - Session metadata and expiration
- `UploadFile` - Individual file details with parse status
- `UploadSessionStats` - Session statistics (file count, total size, downloads)
- `UploadSessionMetadata` - Project, client, and department info
- `POParseResult` - Parsed PO data structure

### 2. **Services** (`src/services/uploadService.ts`)
Complete API service with all endpoints:
- `createSession()` - Create upload session with TTL
- `uploadFile()` - Upload file with optional auto-parsing
- `getSessionDetails()` - Get session info
- `listSessionFiles()` - List files in session
- `getSessionStats()` - Get session statistics
- `downloadFile()` - Download individual file
- `downloadAllAsZip()` - Download all files as ZIP
- `deleteFile()` - Delete specific file
- `deleteSession()` - Delete entire session

### 3. **UI Components**

#### `FileUploadDialog.tsx`
Two-step upload dialog:
- **Step 1 (Form)**: Create session with project details, client selection, TTL
- **Step 2 (Upload)**: Upload files with progress tracking, auto-parse toggle

Features:
- Drag-and-drop file upload
- File progress tracking with status indicators
- Auto-parsing with PO ID extraction
- Client selection dropdown
- Customizable upload metadata

#### `UploadSessionViewer.tsx`
Session management and viewing:
- View session metadata and statistics
- List all files with parse status
- Download individual files or all as ZIP
- Delete files or entire sessions
- Real-time file list updates

#### `FileUploadSection.tsx`
Main dashboard integration:
- Active/expired session management
- Session history with cards
- Quick statistics (active sessions, expired, total files)
- Integration guide toast messages
- localStorage-based session storage for demo

### 4. **Dashboard Integration** (`src/pages/Index.tsx`)
- Added FileUploadSection to main dashboard
- Client list loading on dashboard mount
- Automatic session persistence in localStorage

## Usage

### For Users

1. **Create a New Upload Session**
   ```
   Click "New Upload" → Fill in project details → Select client (optional)
   Set session TTL (24/48/72 hours) → Click "Create Session"
   ```

2. **Upload Files**
   ```
   Drag files into the upload zone or click to select
   Max file size: 50MB per file
   Supported formats: Excel (.xlsx, .xls), CSV, PDF
   Toggle "Auto-parse PO files" for automatic extraction
   ```

3. **View Session Details**
   ```
   Click "View" on any session card in the File Upload Manager
   See files, statistics, and session expiration
   ```

4. **Download Files**
   ```
   Click download button on individual file
   Or use "Download All" to get files as ZIP
   ```

### For Developers

#### Using the Upload Service

```typescript
import { uploadService } from '@/services/uploadService';

// 1. Create session
const session = await uploadService.createSession(
  {
    project: "PO Project Q4",
    description: "Import vendor POs",
    department: "Finance"
  },
  24, // TTL in hours
  1   // client_id (optional)
);

// 2. Upload file with auto-parsing
const result = await uploadService.uploadFile(
  session.session_id,
  fileInput.files[0],
  {
    uploaded_by: "john@example.com",
    auto_parse: true
  }
);

console.log("Parse Status:", result.parse_status);
console.log("PO ID:", result.po_id);

// 3. Get session stats
const stats = await uploadService.getSessionStats(session.session_id);
console.log("Total files:", stats.total_files);
console.log("Total size:", stats.total_size_bytes);

// 4. Download file
await uploadService.downloadFile(session.session_id, result.id);

// 5. Delete session
await uploadService.deleteSession(session.session_id);
```

#### Using the Components

```tsx
import { FileUploadDialog } from '@/components/dashboard/FileUploadDialog';
import { UploadSessionViewer } from '@/components/dashboard/UploadSessionViewer';
import { FileUploadSection } from '@/components/dashboard/FileUploadSection';

// Use FileUploadDialog in any page
const [dialogOpen, setDialogOpen] = useState(false);

<FileUploadDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  clients={[...]}
  onSessionCreated={(session) => {
    console.log("Session created:", session.session_id);
  }}
/>

// Use UploadSessionViewer to show session details
<UploadSessionViewer
  session={selectedSession}
  open={viewerOpen}
  onOpenChange={setViewerOpen}
  onSessionDeleted={() => {
    // Refresh sessions list
  }}
/>

// Use FileUploadSection for full integration
<FileUploadSection
  clients={[...]}
  onFilesUploaded={(session) => {
    // Handle files uploaded
  }}
/>
```

## API Endpoints Reference

### Create Session
```http
POST /api/uploads/session
Content-Type: application/json

{
  "metadata": {
    "project": "string",
    "description": "string",
    "department": "string"
  },
  "ttl_hours": 24,
  "client_id": 1
}
```

### Upload File
```http
POST /api/uploads/session/{session_id}/files
Content-Type: multipart/form-data

file: [Excel/PDF file]
uploaded_by: admin
po_number: PO-2026-001 (optional)
auto_parse: true
```

### Get Session Details
```http
GET /api/uploads/session/{session_id}
```

### List Files
```http
GET /api/uploads/session/{session_id}/files?skip=0&limit=50
```

### Get Statistics
```http
GET /api/uploads/session/{session_id}/stats
```

### Download File
```http
GET /api/uploads/session/{session_id}/files/{file_id}/download
```

### Download All as ZIP
```http
POST /api/uploads/session/{session_id}/download-all
```

### Delete File
```http
DELETE /api/uploads/session/{session_id}/files/{file_id}
```

### Delete Session
```http
DELETE /api/uploads/session/{session_id}
```

## Data Storage & Persistence

### Session Storage
- **LocalStorage**: Demo sessions stored in browser localStorage
- **Production**: Backend storage with database
- **TTL**: Configurable session expiration (default: 24 hours)

### File Storage
- **Compression**: Automatic for xlsx/xls/csv files
- **Location**: Backend filesystem (consider S3/Azure Blob for production)
- **Size Limit**: 50MB per file
- **Formats**: Excel, CSV, PDF

### Auto-Parsing
When `auto_parse=true`:
- **Client 1 (Bajaj)**: Uses Bajaj PO Parser
- **Client 2 (Dava India)**: Uses Proforma Invoice Parser
- **Extraction**: PO number, vendor, amount, line items
- **Insertion**: Auto-inserts into client_po table
- **Error Handling**: Graceful degradation (upload succeeds even if parse fails)

## Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_FILE_UPLOAD_MAX_SIZE=52428800  # 50MB in bytes
```

### Upload Settings
```typescript
// In api.ts
export const ENDPOINTS = {
  UPLOADS: '/uploads'
};

export const API_CONFIG = {
  UPLOAD: {
    MAX_SIZE: 52428800,  // 50MB
    ALLOWED_TYPES: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
  }
};
```

## Error Handling

Common error scenarios and solutions:

```typescript
try {
  await uploadService.uploadFile(sessionId, file, { auto_parse: true });
} catch (error) {
  if (error.message.includes("File too large")) {
    // Handle 413 Payload Too Large
  } else if (error.message.includes("not found")) {
    // Handle 404 Session/File Not Found
  } else if (error.message.includes("Invalid parameters")) {
    // Handle 400 Bad Request
  } else {
    // Handle 500 Server Error
  }
}
```

## Features

✅ **Session-based Management**: Organize uploads by project  
✅ **Auto-parsing**: Automatic PO data extraction  
✅ **File Compression**: Automatic compression for xlsx/xls/csv  
✅ **Multi-client Support**: Different parsers per client  
✅ **Drag-and-drop**: Easy file selection  
✅ **Progress Tracking**: Real-time upload progress  
✅ **Batch Download**: Download all files as ZIP  
✅ **Session Expiration**: Automatic cleanup with TTL  
✅ **Parse Status**: Track parsing success/failure  
✅ **File History**: View all uploaded files with metadata  

## Best Practices

### Session Management
- Always create session before uploading files
- Set appropriate TTL based on use case
- Clean up expired sessions regularly
- Use meaningful project names for organization

### File Handling
- Validate file format before upload (already done by frontend)
- Check maximum file size (50MB limit)
- Use file hashing for integrity verification
- Organize by client for better retrieval

### Auto-Parsing
- Enable only for supported clients (Bajaj, Dava India)
- Handle parsing errors gracefully
- Validate parsed data before using
- Log parsing errors for debugging

### Performance
- Batch multiple files in single session
- Use file compression (automatic)
- Implement pagination for large file lists
- Consider CDN for file downloads

### Security
- Validate session ownership (add auth)
- Scan uploaded files for malware
- Restrict file types
- Use HTTPS in production
- Implement rate limiting
- Store sensitive data encrypted

## Limitations

- **Max File Size**: 50MB per file
- **Session TTL**: Maximum 72 hours
- **File Retention**: Based on session TTL
- **Storage**: Local filesystem (scale to object storage for production)
- **Concurrent Uploads**: No limit (configurable)
- **Supported Formats**: Excel, CSV, PDF

## Integration Examples

### Track Uploaded POs
```typescript
const handleFilesUploaded = async (session: UploadSession) => {
  // Fetch the POs that were auto-parsed
  const files = await uploadService.listSessionFiles(session.session_id);
  
  // Get PO IDs from files that were parsed
  const poIds = files
    .filter(f => f.parse_status === 'SUCCESS' && f.po_id)
    .map(f => f.po_id);
    
  // Refresh PO list or update dashboard
  console.log("Imported PO IDs:", poIds);
};
```

### Custom Upload Handler
```typescript
const handleCustomUpload = async (
  files: File[],
  projectName: string,
  clientId: number
) => {
  try {
    // Create session
    const session = await uploadService.createSession(
      {
        project: projectName,
        description: `Bulk upload ${files.length} files`
      },
      24,
      clientId
    );
    
    // Upload all files
    const results = await Promise.all(
      files.map(file =>
        uploadService.uploadFile(session.session_id, file, {
          auto_parse: true,
          uploaded_by: getCurrentUser()
        })
      )
    );
    
    // Track results
    const successful = results.filter(r => r.parse_status === 'SUCCESS');
    const failed = results.filter(r => r.parse_status === 'FAILED');
    
    console.log(`Uploaded: ${successful.length}/${files.length}`);
    if (failed.length > 0) {
      console.log("Failed files:", failed);
    }
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

## Next Steps

1. **Test the Integration**
   - Create a test session
   - Upload sample PO files
   - Verify auto-parsing with Bajaj/Dava India files

2. **Backend Setup**
   - Ensure API endpoints are ready
   - Configure file storage path
   - Set up database tables (upload_session, upload_file)

3. **Production Deployment**
   - Switch from localStorage to backend session storage
   - Implement object storage (S3/Azure Blob)
   - Add authentication and authorization
   - Configure file cleanup jobs for expired sessions
   - Set up monitoring and logging

4. **Enhancements**
   - Add file preview for CSV/Excel
   - Implement drag-and-drop to existing tables
   - Add bulk operations (delete multiple files)
   - Create session templates
   - Add session sharing/collaboration

## Support & Troubleshooting

### File Upload Fails
- Check file size (max 50MB)
- Verify file format is supported
- Check network connection
- Ensure session hasn't expired

### Parse Errors
- Verify file format matches client parser expectations
- Check for invalid data in file
- Review parse error message
- Manually verify file structure

### Session Expires
- Sessions expire based on TTL setting
- Default TTL is 24 hours
- Can be extended by creating a new session
- Archive important files before expiration

---

For API documentation, see the provided **File Upload Integration Guide** document.
