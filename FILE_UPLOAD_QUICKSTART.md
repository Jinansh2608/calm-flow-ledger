# File Upload Quick Start Guide

## 5-Minute Setup

### 1. Access File Upload Manager
- Open your dashboard
- Scroll to the **File Upload Manager** section at the top of the main content
- You'll see a "New Upload" button

### 2. Create Your First Upload Session

```
Click "New Upload" button
├─ Enter Project Name: "Bajaj Q4 POs"
├─ Select Client: "Bajaj" (optional)
├─ Add Description: "Q4 purchase orders from vendor"
├─ Set Session TTL: 24 hours
└─ Click "Create Session"
```

### 3. Upload Files

```
Step 2 opens automatically after session creation
├─ Drag & drop files OR click to select
├─ Enable "Auto-parse PO files" ✓
├─ Enter "Uploaded by": your email
├─ Click "Upload X file(s)"
└─ Wait for completion ✓
```

### 4. View Uploaded Files

```
Click "View" on a session card
├─ See session details
├─ List all uploaded files
├─ Download individual files
├─ Download all as ZIP
└─ Delete files or entire session
```

## Supported File Types

| Format | Extension | Max Size | Auto-Parse |
|--------|-----------|----------|-----------|
| Excel | `.xlsx`, `.xls` | 50 MB | ✓ Yes |
| CSV | `.csv` | 50 MB | ✓ Yes |
| PDF | `.pdf` | 50 MB | Yes |

## Key Features

### Auto-Parsing
When enabled, system automatically:
- ✓ Extracts PO number, date, vendor
- ✓ Calculates totals and taxes
- ✓ Reads line items
- ✓ Creates PO record in database

### Session Management
- **Create**: Organize uploads by project
- **View**: Check upload history and details
- **Download**: Get files back anytime
- **Delete**: Remove files or entire sessions
- **Expire**: Auto-cleanup after TTL

### Storage & Compression
- Files are automatically compressed (Excel/CSV)
- Save storage space up to 60%
- Original and compressed versions stored
- Download original file anytime

## Common Tasks

### Upload PO File from Bajaj
```
1. New Upload
2. Project: "Bajaj PO Import"
3. Client: "Bajaj"
4. Click Create
5. Upload file
6. Enable Auto-parse
7. Submit ✓
→ PO automatically added to system
```

### Download Files Later
```
1. File Upload Manager
2. Find session in history
3. Click "View"
4. Click download icon on file
5. Or click "Download All" for ZIP
```

### Delete Old Uploads
```
1. Find session in history
2. Click "View"
3. Click trash icon on file (delete single)
4. Or click "Delete Session" (remove all)
5. Confirm deletion
```

## Tips & Tricks

💡 **Session Expiration**: Sessions auto-expire after set TTL. Download important files before expiration.

💡 **Auto-Parse Success**: You'll see a green checkmark if PO was parsed successfully. Errors show in details.

💡 **Batch Uploads**: Upload multiple files at once in a single session for better organization.

💡 **File Organization**: Use meaningful project names to find uploads easily later.

💡 **Active Sessions**: Only active sessions appear at the top. Expired sessions moved to history.

## Troubleshooting

### ❌ Upload Fails - File Too Large
**Solution**: File exceeds 50MB limit. Compress the file or split into smaller parts.

### ❌ Parse Fails - Error Shown
**Solution**: File format might not match expected structure. Check file has required columns.

### ❌ Session Expired
**Solution**: Sessions expire after TTL (default 24 hours). Create new session or archive files before expiration.

### ❌ Can't Find Session
**Solution**: Check "Expired Sessions" section or create new session. Old sessions not accessible after expiration.

## Video Tutorial

For visual walkthrough, see the embedded video in the File Upload Manager info section.

## API Usage (Developers)

### Upload with Technology Stack
```python
# Python
import requests

BASE_URL = "http://localhost:8000/api"

# Create session
session = requests.post(
    f"{BASE_URL}/uploads/session",
    json={
        "metadata": {"project": "Bajaj Q4"},
        "ttl_hours": 24,
        "client_id": 1
    }
).json()

# Upload file
with open("BAJAJ_PO.xlsx", "rb") as f:
    result = requests.post(
        f"{BASE_URL}/uploads/session/{session['session_id']}/files",
        files={"file": f},
        data={
            "uploaded_by": "admin",
            "auto_parse": "true"
        }
    ).json()

print(f"PO ID: {result.get('po_id')}")
```

```javascript
// JavaScript/TypeScript
import { uploadService } from '@/services/uploadService';

// Create session
const session = await uploadService.createSession({
  project: "Bajaj Q4",
  description: "Import vendor POs"
}, 24, 1);

// Upload file
const result = await uploadService.uploadFile(
  session.session_id,
  fileInput.files[0],
  {
    uploaded_by: "admin",
    auto_parse: true
  }
);

console.log("PO ID:", result.po_id);
```

## Session Lifecycle

```
Created → Upload Files → Processing → Available ↘
                                        ↓
                                    TTL Expired ✓ → Auto-Cleanup
```

- **Created**: Session ready for uploads
- **Upload Files**: Add multiple files to session
- **Processing**: Files being parsed (seconds)
- **Available**: Ready to download/use
- **TTL Expired**: Session no longer accepting new files
- **Auto-Cleanup**: Files removed after TTL expiration

## Limits & Quotas

| Limit | Value |
|-------|-------|
| Max File Size | 50 MB |
| Max Session TTL | 72 hours |
| Max Files per Session | Unlimited |
| Max Sessions | Unlimited |
| File Retention | Based on TTL |
| Auto-Parse Support | Bajaj, Dava India |

## Need Help?

- 📧 Email: support@calmflowledger.com
- 📞 Phone: +91-XXXXX-XXXXX
- 💬 Chat: Visit support portal
- 📖 Docs: See FILE_UPLOAD_IMPLEMENTATION.md

---

**Last Updated**: February 2026  
**Version**: 1.0  
**Status**: Production Ready ✓
