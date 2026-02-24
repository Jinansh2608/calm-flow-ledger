# Backend API Endpoints Required for Frontend

This document specifies all the endpoints the frontend expects from the backend API running on `http://localhost:8000/api`.

## Base URL
`http://localhost:8000/api`

## Endpoints Summary

### 1. HEALTH CHECK
- **GET** `/health`
- **Response:**
```json
{
  "status": "SUCCESS",
  "message": "API is healthy"
}
```

---

## VENDOR ENDPOINTS

### 1. Create Vendor
- **POST** `/vendors`
- **Request:**
```json
{
  "name": "Vendor Name",
  "status": "ACTIVE",
  "contact_email": "contact@vendor.com",
  "contact_phone": "+91-9876543210",
  "address": "City, Country",
  "bank_details": "Bank details",
  "gstin": "GSTIN",
  "rating": 4.5
}
```
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "id": 1,
    "name": "Vendor Name",
    "status": "ACTIVE",
    "contact_email": "contact@vendor.com",
    "contact_phone": "+91-9876543210",
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

### 2. Get All Vendors
- **GET** `/vendors?status=ACTIVE&name=Vendor&limit=50&offset=0`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": 1,
      "name": "Vendor Name",
      "status": "ACTIVE",
      "contact_email": "contact@vendor.com",
      "contact_phone": "+91-9876543210"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 3. Get Vendor by ID
- **GET** `/vendors/{vendor_id}`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "id": 1,
    "name": "Vendor Name",
    "status": "ACTIVE",
    "contact_email": "contact@vendor.com",
    "contact_phone": "+91-9876543210",
    "address": "City, Country",
    "bank_details": "Bank details",
    "rating": 4.5,
    "total_orders": 10,
    "total_spent": 5000000
  }
}
```

### 4. Update Vendor
- **PUT** `/vendors/{vendor_id}`
- **Request:** (any fields to update)
```json
{
  "status": "INACTIVE",
  "contact_email": "newemail@vendor.com"
}
```
- **Response:** Same as Get Vendor

### 5. Delete Vendor
- **DELETE** `/vendors/{vendor_id}`
- **Response:**
```json
{
  "status": "SUCCESS",
  "message": "Vendor deleted",
  "data": {
    "vendor_id": 1
  }
}
```

### 6. Get Vendor Payment Summary
- **GET** `/vendors/{vendor_id}/payment-summary`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "vendor_id": 1,
    "total_paid": 2500000,
    "total_pending": 1500000,
    "payment_count": 15,
    "last_payment_date": "2026-02-15"
  }
}
```

### 7. Get Vendor Payments
- **GET** `/vendors/{vendor_id}/payments?limit=50&offset=0`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "amount": 100000,
      "payment_date": "2026-02-15",
      "status": "COMPLETED",
      "reference_number": "TRF001"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### 8. Get Vendor Orders
- **GET** `/vendors/{vendor_id}/projects/{project_id}/orders`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "project_id": 1,
      "purchase_order": "PO-2026-001",
      "order_value": 500000,
      "status": "confirmed",
      "delivery_date": "2026-03-01"
    }
  ]
}
```

---

## PAYMENT ENDPOINTS

### 1. Create Payment
- **POST** `/payments`
- **Request:**
```json
{
  "vendor_id": 1,
  "vendor_order_id": 1,
  "amount": 100000,
  "payment_date": "2026-02-15",
  "status": "COMPLETED",
  "reference_number": "TRF001",
  "notes": "Payment notes"
}
```
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "id": 1,
    "vendor_id": 1,
    "amount": 100000,
    "payment_date": "2026-02-15",
    "status": "COMPLETED",
    "created_at": "2026-02-17T10:00:00Z"
  }
}
```

### 2. Get Payment by ID
- **GET** `/payments/{payment_id}`
- **Response:** Same as Create Payment response

### 3. List Payments
- **GET** `/payments?vendor_id=1&status=COMPLETED&limit=50&offset=0`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": 1,
      "vendor_id": 1,
      "amount": 100000,
      "payment_date": "2026-02-15",
      "status": "COMPLETED"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### 4. Update Payment
- **PUT** `/payments/{payment_id}`
- **Request:** (any fields to update)
```json
{
  "status": "PENDING",
  "notes": "Updated notes"
}
```
- **Response:** Same as Create Payment response

### 5. Delete Payment
- **DELETE** `/payments/{payment_id}`
- **Response:**
```json
{
  "status": "SUCCESS",
  "message": "Payment deleted",
  "data": {
    "payment_id": 1
  }
}
```

### 6. Get Payment Summary
- **GET** `/payments/summary`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "total_amount": 5000000,
    "total_completed": 3500000,
    "total_pending": 1500000,
    "completed_count": 12,
    "pending_count": 5,
    "vendors": [
      {
        "vendor_id": 1,
        "vendor_name": "Vendor 1",
        "total_paid": 2500000,
        "total_pending": 1500000,
        "payment_count": 10
      }
    ]
  }
}
```

### 7. Get Pending Payments
- **GET** `/payments?status=PENDING&limit=50&offset=0`
- **Response:** Same as List Payments

### 8. Bulk Process Payments
- **POST** `/payments/bulk-process`
- **Request:**
```json
{
  "payment_ids": [1, 2, 3],
  "action": "process"
}
```
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "processed_count": 3,
    "failed_count": 0,
    "payments": [...]
  }
}
```

---

## PURCHASE ORDER ENDPOINTS (Existing)

### 1. Get All POs
- **GET** `/po`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "pos": [...],
    "total_count": 10
  }
}
```

### 2. Get PO by ID
- **GET** `/po/{po_id}`

### 3. Get PO Details (with Line Items & Payments)
- **GET** `/po/{po_id}/details`

### 4. Get PO Files
- **GET** `/po/{po_number}`

---

## UPLOAD ENDPOINTS

### 1. Create Upload Session
- **POST** `/uploads/session`
- **Request:**
```json
{
  "project": "Project Name",
  "description": "Upload Description",
  "client_id": 1,
  "ttl_hours": 24
}
```
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "session_id": "session-1708187200000",
    "project": "Project Name",
    "created_at": "2026-02-17T10:00:00Z",
    "expires_at": "2026-02-18T10:00:00Z"
  }
}
```

### 2. Upload File to Session
- **POST** `/uploads/session/{session_id}/upload`
- **Content-Type:** `multipart/form-data`
- **Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "file_id": "file-123",
    "filename": "document.pdf",
    "file_size": 1024000,
    "uploaded_at": "2026-02-17T10:00:00Z"
  }
}
```

---

## ERROR RESPONSES

All endpoints should return errors in this format:
```json
{
  "status": "ERROR",
  "error_code": "VALIDATION_ERROR",
  "message": "Error description",
  "errors": [
    {
      "field": "vendor_id",
      "message": "Vendor ID is required",
      "type": "REQUIRED"
    }
  ]
}
```

---

## Frontend Service Usage

The frontend services call these endpoints through:
- `vendorService` - Manages vendor CRUD and analytics
- `paymentService` - Manages payment CRUD and analytics
- `poService` - Manages purchase orders
- `uploadService` - Manages file uploads

All are called through the centralized `apiRequest()` function which adds authentication headers and error handling.

### Example Service Call
```typescript
const vendors = await vendorService.getAllVendors({ status: 'ACTIVE', limit: 10 });
// This calls: GET http://localhost:8000/api/vendors?status=ACTIVE&limit=10&offset=0
// And expects response: { data: [...], total: X, limit: 10, offset: 0 }
```
