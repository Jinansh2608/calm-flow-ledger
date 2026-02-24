# File Upload System Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Index.tsx (Dashboard)                            │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │  │
│  │  │ DashboardHeader │  │ FilterSidebar    │  │ Summary Cards   │   │  │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────┘   │  │
│  │          │                    │                      │             │  │
│  │          └────────────────────┴──────────────────────┘             │  │
│  │                             ▼                                       │  │
│  │  ┌─────────────────────────────────────────────────────┐           │  │
│  │  │          FileUploadSection                          │           │  │
│  │  │  ┌───────────────────────────────────────────────┐  │           │  │
│  │  │  │ FileUploadDialog │ UploadSessionViewer       │  │           │  │
│  │  │  │ - Create Session │ - View Session Details    │  │           │  │
│  │  │  │ - Upload Files   │ - List Files              │  │           │  │
│  │  │  │ - Auto-Parse     │ - Download File(s)        │  │           │  │
│  │  │  │ - Show Progress  │ - Delete Session/Files    │  │           │  │
│  │  │  └───────────────────────────────────────────────┘  │           │  │
│  │  └─────────────────────────────────────────────────────┘           │  │
│  │           ▼                          ▼                             │  │
│  │   + Session History          + Session Stats                       │  │
│  │   + Active Sessions          + File List                          │  │
│  │   + Expired Sessions         + Download Options                   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│           │                                                           │  │
│           ▼                                                            │  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Upload Service Layer                           │  │
│  │  uploadService.createSession()                                     │  │
│  │  uploadService.uploadFile()                                        │  │
│  │  uploadService.getSessionDetails()                                 │  │
│  │  uploadService.listSessionFiles()                                  │  │
│  │  uploadService.getSessionStats()                                   │  │
│  │  uploadService.downloadFile()                                      │  │
│  │  uploadService.downloadAllAsZip()                                  │  │
│  │  uploadService.deleteFile()                                        │  │
│  │  uploadService.deleteSession()                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│           │                                                           │  │
│           ▼                                                            │  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        API Layer (config/api.ts)                    │  │
│  │  - Base URL Configuration                                          │  │
│  │  - Request Timeout                                                 │  │
│  │  - File Upload Settings                                            │  │
│  │  - Authorization Headers                                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │   HTTP Network Layer (REST)    │
              │   - Multipart Form Data        │
              │   - Bearer Token Auth          │
              │   - HTTPS (Production)         │
              └────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (API Server)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      API Endpoints                                  │  │
│  │  POST   /api/uploads/session             (Create Session)          │  │
│  │  GET    /api/uploads/session/{id}        (Get Details)             │  │
│  │  DELETE /api/uploads/session/{id}        (Delete Session)          │  │
│  │  POST   /api/uploads/session/{id}/files  (Upload File)             │  │
│  │  GET    /api/uploads/session/{id}/files  (List Files)              │  │
│  │  GET    /api/uploads/session/{id}/files/{fid}/download (Download)  │  │
│  │  DELETE /api/uploads/session/{id}/files/{fid} (Delete File)        │  │
│  │  GET    /api/uploads/session/{id}/stats  (Get Stats)               │  │
│  │  POST   /api/uploads/session/{id}/download-all (Download ZIP)      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                   ▼                    ▼                    ▼            │
│  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐ │
│  │  Request Handling    │ │  File Processing  │ │  Auto-Parsing        │ │
│  │ - Validation         │ │ - Compression     │ │ - Parser Selection   │ │
│  │ - Auth Check         │ │ - Hashing         │ │ - PO Extraction      │ │
│  │ - Error Handling     │ │ - Storage Path    │ │ - Data Validation    │ │
│  └──────────────────────┘ └──────────────────┘ └──────────────────────┘ │
│           ▼                      ▼                       ▼                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      File Storage                                   │  │
│  │  /storage/uploads/                                                 │  │
│  │  ├── session_{id}/                                                 │  │
│  │  │   ├── file_{uuid}.xlsx (Original)                               │  │
│  │  │   ├── file_{uuid}.xlsx.gz (Compressed)                          │  │
│  │  │   └── ...                                                       │  │
│  │  └── backups/                                                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│           │                                                            │  │
│           ▼                                                             │  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Database (PostgreSQL)                          │  │
│  │  ┌──────────────────────┐        ┌──────────────────────────────┐  │  │
│  │  │  upload_session      │        │  upload_file                 │  │  │
│  │  ├──────────────────────┤        ├──────────────────────────────┤  │  │
│  │  │ session_id (PK)      │        │ id (PK)                      │  │  │
│  │  │ client_id (FK)       │        │ session_id (FK)              │  │  │
│  │  │ metadata (JSONB)     │        │ po_number                    │  │  │
│  │  │ created_at           │        │ original_filename            │  │  │
│  │  │ expires_at           │        │ file_size                    │  │  │
│  │  │ status               │        │ compressed_size              │  │  │
│  │  │ ttl_hours            │        │ is_compressed                │  │  │
│  │  └──────────────────────┘        │ parse_status                 │  │  │
│  │                │                 │ po_id (FK) ──────────┐       │  │  │
│  │                └─────────────────┼──────────────────────┼────┐  │  │  │
│  │                                  │ ...                  │    │  │  │  │
│  │                                  └──────────────────────┘    │  │  │  │
│  │                                                              │  │  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │  │  │
│  │  │  client_po (Related)                                 │  │  │  │  │
│  │  ├──────────────────────────────────────────────────────┤  │  │  │  │
│  │  │ id (PK)                                              │◄─┘  │  │  │
│  │  │ po_number                                            │     │  │  │
│  │  │ po_date                                              │     │  │  │
│  │  │ vendor_name                                          │     │  │  │
│  │  │ amount                                               │     │  │  │
│  │  │ ... (Line items, taxes, etc.)                        │     │  │  │
│  │  └──────────────────────────────────────────────────────┘     │  │  │
│  │                                                                 │  │  │
│  │  ┌──────────────────────────────────────────────────────┐     │  │  │
│  │  │  client (Related)                                    │◄────┘  │  │
│  │  ├──────────────────────────────────────────────────────┤        │  │
│  │  │ id (PK)                                              │        │  │
│  │  │ name                                                 │        │  │
│  │  │ ...                                                  │        │  │
│  │  └──────────────────────────────────────────────────────┘        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action                 Frontend                   Backend
                           Component          Service  API
────────────────────────────────────────────────────────────────

Click "New Upload"  ──────────────────────────────────────────────
                    FileUploadDialog (Step 1)
                           │
Fill Form & Submit ─────────┤
                            ▼
                    uploadService.createSession()
                            │
                            ▼ (HTTP POST)
                          ─────────────────► POST /api/uploads/session
                                                    │
                                                    ▼
                                          Validate request
                                                    │
                                                    ▼
                                          Create session_id
                                                    │
                                                    ▼
                                          Insert into upload_session
                                                    │
                                                    ▼
                          ◄───────────────── Return session details
                            │
                    Store session
                            │
                            ▼
                    FileUploadDialog (Step 2)
                            │
Drag & Drop Files ─────────┤
                            ▼
Select & Upload ───────────┤
                            ▼
                    uploadService.uploadFile()
                            │
                            ▼ (HTTP POST multipart)
                          ─────────────────► POST /api/uploads/session/{id}/files
                                                    │
                                                    ▼
                                          Validate file
                                                    │
                                                    ▼
                                          Save to storage
                                                    │
                                                    ▼
                                          Compress (optional)
                                                    │
                                                    ▼
                                        Calculate hashes
                                                    │
                                                    ▼
                                          [IF auto_parse enabled]
                                          Parse PO data
                                                    │
                                                    ▼
                                          Insert into client_po
                                                    │
                                                    ▼
                                          Insert into upload_file
                                                    │
                                                    ▼
                          ◄───────────────── Return file details + po_id
                            │
                    Display progress ✓
                            │
View Session ──────────────┤
                            ▼
                    uploadService.getSessionDetails()
                    uploadService.listSessionFiles()
                    uploadService.getSessionStats()
                            │
                            ▼ (HTTP GET)
                          ─────────────────► Multiple GET requests
                                                    │
                                                    ▼
                          ◄───────────────── Return session/files/stats
                            │
                    Display in UploadSessionViewer
                            │
Download File ─────────────┤
                            ▼
                    uploadService.downloadFile()
                            │
                            ▼ (HTTP GET)
                          ─────────────────► GET /api/uploads/.../download
                                                    │
                                                    ▼
                                          Read from storage
                                                    │
                                                    ▼
                          ◄───────────────── Return binary file
                            │
                    Trigger browser download
                            │
Delete File ───────────────┤
                            ▼
                    uploadService.deleteFile()
                            │
                            ▼ (HTTP DELETE)
                          ─────────────────► DELETE /api/uploads/.../files/{id}
                                                    │
                                                    ▼
                                          Delete from storage
                                                    │
                                                    ▼
                                          Delete from upload_file
                                                    │
                                                    ▼
                          ◄───────────────── Return success
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       Index.tsx                             │
│               (Dashboard Page)                              │
│  - State: clients, selectedPO, drawerOpen                  │
│  - Loads: clients on mount                                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌─────────────────┐   ┌──────────────────────┐
        │ FilterSidebar   │   │ FileUploadSection    │
        │                 │   │                      │
        │ - Category Tabs │   │ - "New Upload" btn   │
        │ - Date Range    │   │ - Session Cards      │
        │ - Client Filter │   │ - Active/Expired     │
        │ - Budget Range  │   │ - Stats Summary      │
        └─────────────────┘   └──────────┬───────────┘
                              │          │
                              ▼          ▼
                    ┌─────────────────────────────┐
                    │  FileUploadDialog Modal     │
                    │                             │
                    │  Step 1: Session Form       │
                    │  - Project name             │
                    │  - Client select            │
                    │  - Description              │
                    │  - TTL config               │
                    │  ▼ Create Session ▼         │
                    │                             │
                    │  Step 2: File Upload        │
                    │  - Drag/drop zone           │
                    │  - Progress tracking        │
                    │  - Auto-parse toggle        │
                    │  - Upload button            │
                    └──┬───────────────────────┬──┘
                       │                       │
                       ▼                       ▼
        ┌──────────────────────┐  ┌─────────────────────────┐
        │ uploadService Layer  │  │ UploadSessionViewer     │
        │                      │  │ Modal                   │
        │ - createSession()    │  │                         │
        │ - uploadFile()       │  │ - Session Details       │
        │ - listFiles()        │  │ - File List             │
        │ - downloadFile()     │  │ - Download Buttons      │
        │ - deleteFile()       │  │ - Delete Confirmations  │
        │ - getStats()         │  │ - Stats Display         │
        │ - deleteSession()    │  │                         │
        └──────────┬───────────┘  └──────────┬──────────────┘
                   │                        │
                   └────────────┬───────────┘
                                ▼
                   ┌───────────────────────────┐
                   │    API Layer (fetch)      │
                   │ - Base URL + Endpoints    │
                   │ - Headers + Auth          │
                   │ - Error Handling          │
                   └────────────┬──────────────┘
                                ▼
                   ┌───────────────────────────┐
                   │   Backend API Server      │
                   │ - Process Requests        │
                   │ - Access Database         │
                   │ - File Operations         │
                   │ - Auto-Parsing            │
                   └───────────────────────────┘
```

## State Management Flow

```
Initialization (useEffect)
         │
         ▼
Load Clients from API
         │
         ▼
┌─────────────────────────┐
│  DashboardState         │
├─────────────────────────┤
│ clients: Client[]       ││
│ summaryData: Summary    │
│ isFiltered: boolean     │
└────────┬────────────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ FileUploadDialog State   │   │ UploadSessionViewer State    │
├──────────────────────────┤   ├──────────────────────────────┤
│ open: boolean            │   │ session: UploadSession|null  │
│ step: 'form'|'upload'    │   │ open: boolean                │
│ session: UploadSession   │   │ files: UploadFile[]          │
│ isLoading: boolean       │   │ stats: UploadSessionStats    │
│ isUploading: boolean     │   │ isLoading: boolean           │
│                          │   │ deleteFileId: string|null    │
│ Form State:              │   │                              │
│ projectName: string      │   │                              │
│ description: string      │   │                              │
│ department: string       │   │                              │
│ clientId: string         │   │                              │
│ ttlHours: string         │   │                              │
│                          │   │                              │
│ Upload State:            │   │                              │
│ selectedFiles: File[]    │   │                              │
│ uploadProgress[]         │   │                              │
│ autoParse: boolean       │   │                              │
│ uploadedBy: string       │   │                              │
└──────────────────────────┘   └──────────────────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    ▼
         ┌──────────────────────┐
         │  FileUploadSection   │
         │  State               │
         ├──────────────────────┤
         │ sessions: SessionItem│
         │ selectedSession      │
         │ uploadDialogOpen     │
         │ sessionViewerOpen    │
         └──────────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ▼
┌───────────────────────────┐
│ Frontend Validation       │
├───────────────────────────┤
│ - File size check         │
│ - File type validation    │
│ - Required fields check   │
└───────┬───────────────────┘
        │
    No  │ Yes
    ├───┤
    │   ▼
    │  Upload to API
    │   │
    │   ▼
    │  ┌──────────────────────┐
    │  │ API Response         │
    │  ├──────────────────────┤
    │  │ Status Code Check    │
    │  │ - 200: Success       │
    │  │ - 400: Bad Request   │
    │  │ - 404: Not Found     │
    │  │ - 413: File Too Large│
    │  │ - 500: Server Error  │
    │  └───┬──────────────────┘
    │      │
    │      ▼
    │  ┌───────────────┐
    │  │ Error Type?   │
    │  └────┬──────┬───┘
    │       │      │
    │       ▼      ▼
    │   Network  Application
    │   Error    Error
    │       │       │
    │       ▼       ▼
    │  Retry      Show
    │  Logic      Toast
    │       │       │
    └───────┼───────┘
            │
            ▼
    ┌──────────────────┐
    │ User Notification│
    │ - Toast message  │
    │ - Error details  │
    │ - Retry button   │
    └──────────────────┘
```

---

This architecture ensures:
- ✓ Clear separation of concerns
- ✓ Scalable component structure
- ✓ Efficient data flow
- ✓ Robust error handling
- ✓ Type-safe operations
- ✓ User-friendly feedback
