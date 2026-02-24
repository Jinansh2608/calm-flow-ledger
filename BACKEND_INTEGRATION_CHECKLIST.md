# Backend Integration Checklist

Complete this checklist to ensure your backend is ready for the file upload system.

## Database Setup

- [ ] Create `upload_session` table
  ```sql
  CREATE TABLE upload_session (
    session_id VARCHAR PRIMARY KEY,
    client_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR,
    ttl_hours INT,
    FOREIGN KEY (client_id) REFERENCES client(id)
  );
  ```

- [ ] Create `upload_file` table
  ```sql
  CREATE TABLE upload_file (
    id VARCHAR PRIMARY KEY,
    session_id VARCHAR,
    po_number VARCHAR,
    original_filename VARCHAR,
    storage_filename VARCHAR,
    storage_path TEXT,
    file_size BIGINT,
    compressed_size BIGINT,
    is_compressed BOOLEAN,
    mime_type VARCHAR,
    file_hash VARCHAR,
    compressed_hash VARCHAR,
    upload_timestamp TIMESTAMP,
    uploaded_by VARCHAR,
    metadata JSONB,
    status VARCHAR,
    parse_status VARCHAR,
    parse_error TEXT,
    po_id BIGINT,
    FOREIGN KEY (session_id) REFERENCES upload_session(session_id),
    FOREIGN KEY (po_id) REFERENCES client_po(id)
  );
  ```

- [ ] Create indexes for performance
  ```sql
  CREATE INDEX idx_upload_session_client ON upload_session(client_id);
  CREATE INDEX idx_upload_session_created ON upload_session(created_at);
  CREATE INDEX idx_upload_session_expires ON upload_session(expires_at);
  CREATE INDEX idx_upload_file_session ON upload_file(session_id);
  CREATE INDEX idx_upload_file_po ON upload_file(po_id);
  CREATE INDEX idx_upload_file_timestamp ON upload_file(upload_timestamp);
  ```

## API Endpoints

### Session Management

- [ ] `POST /api/uploads/session` - Create upload session
  - **Request**: metadata, ttl_hours, client_id (optional)
  - **Response**: session_id, created_at, expires_at, status, file_count
  - **Status Codes**: 200 (success), 400 (invalid), 500 (error)

- [ ] `GET /api/uploads/session/{session_id}` - Get session details
  - **Response**: UploadSession object with metadata
  - **Status Codes**: 200, 404, 500

- [ ] `DELETE /api/uploads/session/{session_id}` - Delete session
  - **Response**: { status: "SUCCESS" }
  - **Status Codes**: 200, 404, 500

### File Operations

- [ ] `POST /api/uploads/session/{session_id}/files` - Upload file
  - **Request**: multipart/form-data with file, options
  - **Response**: UploadFile object with parse_status, po_id
  - **Auto-parse**: If enabled and client_id provided
  - **Status Codes**: 200, 400, 404, 413 (too large), 500

- [ ] `GET /api/uploads/session/{session_id}/files` - List files
  - **Query**: skip, limit, status (optional)
  - **Response**: Array of UploadFile objects
  - **Status Codes**: 200, 404, 500

- [ ] `GET /api/uploads/session/{session_id}/files/{file_id}/download` - Download file
  - **Response**: Binary file with Content-Disposition header
  - **Status Codes**: 200, 404, 500

- [ ] `DELETE /api/uploads/session/{session_id}/files/{file_id}` - Delete file
  - **Response**: { deleted: true }
  - **Status Codes**: 200, 404, 500

### Statistics & Batch Operations

- [ ] `GET /api/uploads/session/{session_id}/stats` - Get session stats
  - **Response**: { total_files, total_size_bytes, total_downloads, status }
  - **Status Codes**: 200, 404, 500

- [ ] `POST /api/uploads/session/{session_id}/download-all` - Download all as ZIP
  - **Response**: ZIP file
  - **Status Codes**: 200, 404, 500

## File Processing

### Storage

- [ ] File storage directory configured
  - [ ] Path: `/uploads/` or configurable
  - [ ] Permissions: Read/write for API user
  - [ ] Disk space: Sufficient for max concurrent uploads

- [ ] File compression implemented
  - [ ] Library: e.g., `zlib`, `zipfile`, `lz4`
  - [ ] Formats: Excel, CSV, PDF
  - [ ] Compression ratio tracking

### Parsing

- [ ] Bajaj PO Parser implemented
  - [ ] Extracts: po_number, po_date, vendor, amount
  - [ ] Handles: Multiple sheet formats
  - [ ] Error handling: Graceful degradation
  - [ ] Inserts to: `client_po` table

- [ ] Dava India Parser implemented (if needed)
  - [ ] Extracts: pi_number, date, vendor, amount
  - [ ] Handles: Proforma invoice format
  - [ ] Error handling: Graceful degradation

- [ ] Parser selector based on client_id
  ```python
  def select_parser(client_id):
      if client_id == 1:
          return BajajPOParser()
      elif client_id == 2:
          return DavaIndiaPIParser()
      return None
  ```

## Security

- [ ] Authentication implemented
  - [ ] Endpoint protection: Bearer token
  - [ ] Session ownership validation
  - [ ] User permission checks

- [ ] File validation
  - [ ] MIME type checking
  - [ ] File extension validation
  - [ ] Magic number verification
  - [ ] Size limit enforcement (50MB)

- [ ] File sanitization
  - [ ] Malware scanning (optional)
  - [ ] Filename sanitization
  - [ ] Path traversal prevention
  - [ ] Executable file blocking

- [ ] Data protection
  - [ ] HTTPS required
  - [ ] File encryption at rest (optional)
  - [ ] Secure temporary file handling
  - [ ] Access logging

## Maintenance Jobs

- [ ] Session cleanup job
  - [ ] Frequency: Daily or every 6 hours
  - [ ] Action: Delete expired sessions and files
  - [ ] Logging: Record cleanup results

- [ ] File integrity check
  - [ ] Frequency: Weekly
  - [ ] Action: Verify file hashes, check storage
  - [ ] Logging: Report any corrupted files

- [ ] Disk space monitoring
  - [ ] Alert when usage > 80%
  - [ ] Archive old sessions to cold storage
  - [ ] Implement retention policies

## Testing

- [ ] Unit tests
  - [ ] Session creation/deletion
  - [ ] File upload/download
  - [ ] Parser functionality
  - [ ] Error handling

- [ ] Integration tests
  - [ ] Full upload flow
  - [ ] Auto-parsing with database insertion
  - [ ] Permission and auth checks
  - [ ] File compression verification

- [ ] Performance tests
  - [ ] Large file uploads (45-50MB)
  - [ ] Concurrent uploads
  - [ ] Large session queries
  - [ ] ZIP download generation

- [ ] Security tests
  - [ ] Unauthorized access attempts
  - [ ] Path traversal attacks
  - [ ] Malicious file uploads
  - [ ] SQL injection prevention

## Deployment

- [ ] Environment variables configured
  ```
  UPLOAD_DIR=/var/uploads
  MAX_FILE_SIZE=52428800
  SESSION_TTL_MAX=72
  SESSION_CLEANUP_FREQUENCY=6h
  ENABLE_COMPRESSION=true
  ENABLE_MALWARE_SCAN=true
  ```

- [ ] Error handling and logging
  - [ ] Detailed logs for debugging
  - [ ] Error tracking (Sentry, etc.)
  - [ ] Performance monitoring
  - [ ] Audit trails for file operations

- [ ] Documentation
  - [ ] API endpoint documentation
  - [ ] Database schema documentation
  - [ ] Deployment guide
  - [ ] Troubleshooting guide

## Monitoring & Alerts

- [ ] Setup monitoring for
  - [ ] API response times
  - [ ] Upload success/failure rates
  - [ ] Parser error rates
  - [ ] Disk usage
  - [ ] Session cleanup job status

- [ ] Setup alerts for
  - [ ] API errors (500 errors)
  - [ ] Upload failures > 10%
  - [ ] Parser errors > 5%
  - [ ] Disk usage > 80%
  - [ ] Cleanup job failures

## Documentation

- [ ] API Documentation
  - [ ] Endpoint descriptions
  - [ ] Request/response examples
  - [ ] Error codes and meanings
  - [ ] Authentication requirements

- [ ] Deployment Guide
  - [ ] Installation steps
  - [ ] Configuration options
  - [ ] Database setup
  - [ ] Troubleshooting

- [ ] Operational Guide
  - [ ] Monitoring setup
  - [ ] Backup procedures
  - [ ] Disaster recovery
  - [ ] Performance tuning

## Post-Deployment

- [ ] Production smoke tests
  - [ ] [ ] Create session
  - [ ] [ ] Upload file
  - [ ] [ ] Verify parsing (if enabled)
  - [ ] [ ] Download file
  - [ ] [ ] Access session stats

- [ ] Performance validation
  - [ ] [ ] Single file upload < 5s
  - [ ] [ ] File download < 3s
  - [ ] [ ] Session query < 100ms
  - [ ] [ ] Concurrent uploads work

- [ ] Security validation
  - [ ] [ ] Authentication required
  - [ ] [ ] File size limits enforced
  - [ ] [ ] Invalid files rejected
  - [ ] [ ] Logs captured properly

## Support Resources

### Documentation
- API Reference: See provided guide
- Implementation Guide: See FILE_UPLOAD_IMPLEMENTATION.md
- Quick Start: See FILE_UPLOAD_QUICKSTART.md

### Libraries & Tools
- **Python**: `FastAPI`, `python-multipart`, `zipfile`, `openpyxl`
- **Node.js**: `Express`, `multer`, `jszip`, `xlsx`
- **Java**: `Spring Boot`, `commons-fileupload`, `zip4j`, `apache-poi`
- **Go**: `gin`, `multi-part`, `archive/zip`, `excelize`

### Common Issues

**Issue**: File upload times out
- **Solution**: Increase request timeout, optimize parsing, use chunked uploads

**Issue**: Parser fails on valid file
- **Solution**: Check file format, verify parser expectations, test with sample files

**Issue**: Disk space filling up
- **Solution**: Implement cleanup job, reduce TTL, compress files, archive old sessions

**Issue**: High memory usage during parsing
- **Solution**: Stream large files, use chunked processing, optimize parser

---

## Completion Checklist Summary

| Category | Status |
|----------|--------|
| Database Setup | [ ] Complete |
| API Endpoints | [ ] Complete |
| File Processing | [ ] Complete |
| Security | [ ] Complete |
| Maintenance Jobs | [ ] Complete |
| Testing | [ ] Complete |
| Deployment | [ ] Complete |
| Monitoring | [ ] Complete |
| Documentation | [ ] Complete |
| Production Testing | [ ] Complete |

---

**Sign-off**: _______________ Date: _______________

Once all items are checked, the backend is ready for production use.
