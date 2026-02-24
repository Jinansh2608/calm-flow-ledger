# NexGen Finances - Complete Frontend Integration Guide
**Version:** 2.0 - Production Ready  
**Last Updated:** February 17, 2026  
**Status:** ✅ **FULLY INTEGRATED**

---

## 📋 Table of Contents
1. [What's New](#whats-new)
2. [System Architecture](#system-architecture)
3. [Quick Start](#quick-start)
4. [API Client Features](#api-client-features)
5. [Common Workflows](#common-workflows)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Debugging & Monitoring](#debugging--monitoring)
9. [Production Checklist](#production-checklist)

---

## 🚀 What's New

### Enhanced API Client (`src/services/api.ts`)
✅ **Automatic Retry Logic** - Exponential backoff with configurable retries  
✅ **Request/Response Logging** - Detailed tracking of all API calls  
✅ **Response Caching** - TTL-based caching for GET requests  
✅ **Error Classification** - Specific error types for better handling  
✅ **Timeout Management** - Configurable request timeouts  
✅ **Custom Error Classes** - APIError, NetworkError, TimeoutError, ValidationError  
✅ **Request ID Tracking** - Unique IDs for debugging  
✅ **Performance Metrics** - Duration tracking for all requests

### API Helpers (`src/services/apiHelpers.ts`)
✅ **Validators** - Email, phone, GSTIN, number validation  
✅ **Error Handlers** - Utilities for consistent error handling  
✅ **Batch Operations** - Process multiple items in parallel or sequential  
✅ **Pagination Systems** - Helpers for page-based navigation  
✅ **Data Transformers** - Format currencies, dates, parse JSON safely  
✅ **Common Patterns** - Safe resource operations (create, read, update, delete)  
✅ **Retry Utilities** - Built-in retry with exponential backoff  
✅ **Debounce & Throttle** - Performance optimization helpers  
✅ **Diagnostics** - Export logs, get summaries, analyze requests

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Frontend Application (React)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  UI Components/Pages                         │  │
│  │  (DetailDrawer, Dashboard, etc.)             │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                 │
│  ┌────────────────┴─────────────────────────────┐  │
│  │  Service Layer (poService, vendorService, .) │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                 │
│  ┌────────────────┴─────────────────────────────┐  │
│  │  API Helpers & Utilities                     │  │
│  │  (validators, transformers, batch ops, etc.) │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                 │
│  ┌────────────────┴─────────────────────────────┐  │
│  │  Enhanced API Client                         │  │
│  │  ├─ apiRequest() - Main HTTP handler         │  │
│  │  ├─ Retry Logic & Error Handling             │  │
│  │  ├─ Request Logging & Caching                │  │
│  │  └─ Authentication Manager                   │  │
│  └────────────────┬─────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                 HTTP/REST Boundary                   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/CORS
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────────────┐    ┌──────▼────────────┐
    │  /api/...      │    │  /uploads/...     │
    │  FastAPI       │    │  Upload Service   │
    │  Backend       │    │  (Python)         │
    └───┬────────────┘    └────────┬──────────┘
        │                          │
        └──────────────┬───────────┘
                       │
            ┌──────────▼──────────┐
            │  PostgreSQL DB      │
            │  (15+ Tables)       │
            └─────────────────────┘
```

---

## ⚡ Quick Start

### 1. Backend Setup (First Time Only)
```bash
cd Backend
pip install -r requirements.txt
python run.py
# Backend runs at: http://localhost:8000
```

### 2. Frontend Already Configured
The frontend is pre-configured to connect to `http://localhost:8000/api`

### 3. Test Connection
```typescript
import { healthService, apiClient } from '@/services';

// Check backend health
const health = await healthService.checkHealth();
console.log('Backend status:', health);

// View request history
const history = apiClient.getRequestHistory();
console.log('All requests:', history);
```

### 4. Your First API Call
```typescript
import { projectService } from '@/services';

// Fetch all projects
const response = await projectService.getAllProjects();
console.log('Projects:', response.data.projects);
```

---

## 🔧 API Client Features

### Feature 1: Automatic Retries

```typescript
// Automatically retries with exponential backoff
// - 1st attempt: immediate
// - 2nd attempt: 1 second delay
// - 3rd attempt: 2 second delay
// Won't retry on 4xx errors (except 429 rate limit)

const response = await apiClient.get('/api/projects');
```

### Feature 2: Error Classification

```typescript
import { APIError, ValidationError, NetworkError, TimeoutError } from '@/services';

try {
  // Your API call
} catch (error) {
  if (error instanceof ValidationError) {
    // Field-level validation errors
    console.error('Validation:', error.fields);
  } else if (error instanceof APIError) {
    // HTTP errors with status codes
    console.error(`API Error ${error.status}:`, error.message);
  } else if (error instanceof NetworkError) {
    // Network connectivity issues
    console.error('Network problem:', error.message);
  } else if (error instanceof TimeoutError) {
    // Request timeout
    console.error('Request timed out');
  }
}
```

### Feature 3: Response Caching

```typescript
// GET requests are automatically cached for 5 seconds
// Same request within 5 seconds returns cached data

// First call: hits API
const projects1 = await apiClient.get('/api/projects');

// Second call (within 5 seconds): returns cached data
const projects2 = await apiClient.get('/api/projects');
// Note: console shows "Cache hit"

// Third call (bypassing cache):
const projects3 = await apiClient.get('/api/projects', { bypassCache: true });
// Note: this hits the API even though it's cached
```

### Feature 4: Request Logging

```typescript
import { requestLogger } from '@/services';

// Get all requests made
const history = requestLogger.getHistory();
console.log('Total requests:', history.length);

// Get only errors
const errors = requestLogger.getErrorHistory();
console.log('Failed requests:', errors);

// Export logs for debugging
const logsJSON = requestLogger.exportLogs();
console.log(logsJSON);

// Clear logs
requestLogger.clear();
```

### Feature 5: Performance Metrics

```typescript
import { diagnostics } from '@/services/apiHelpers';

// Get usage summary
const summary = diagnostics.getSummary();
console.log({
  totalRequests: summary.totalRequests,
  totalErrors: summary.totalErrors,
  averageDuration: summary.averageDuration + 'ms',
  slowestRequest: summary.slowestRequest + 'ms',
  errorRate: (summary.errorRate * 100).toFixed(2) + '%'
});
```

---

## 📝 Common Workflows

### Workflow 1: Create a Project with Proper Error Handling

```typescript
import { projectService } from '@/services';
import { getErrorMessage } from '@/services/apiHelpers';

async function createProjectSafely(projectData: any) {
  try {
    // Validate input
    if (!projectData.name) {
      throw new Error('Project name is required');
    }

    // Create project
    const response = await projectService.createProject(projectData);
    console.log('✅ Project created:', response.data.id);
    return response.data;
  } catch (error) {
    // User-friendly error message
    const message = getErrorMessage(error);
    console.error('❌ Failed to create project:', message);
    // Could display toast notification here
    return null;
  }
}
```

### Workflow 2: Fetch Data with Fallback

```typescript
import { getResourceWithFallback } from '@/services/apiHelpers';

// If API fails, use fallback empty array
const projects = await getResourceWithFallback(
  () => projectService.getAllProjects(),
  { projects: [], project_count: 0 }
);

console.log('Projects (with fallback):', projects);
```

### Workflow 3: Batch Create Vendors

```typescript
import { batchOperation } from '@/services/apiHelpers';
import { vendorService } from '@/services';

const vendors = [
  { name: 'Vendor A', email: 'a@vendor.com' },
  { name: 'Vendor B', email: 'b@vendor.com' },
  { name: 'Vendor C', email: 'c@vendor.com' }
];

// Create all vendors in parallel (but limited to 3 at a time)
const results = await batchOperation(
  vendors,
  (vendor) => vendorService.createVendor(vendor),
  {
    parallel: true,
    batchSize: 3,
    onProgress: (completed, total) => {
      console.log(`Created ${completed}/${total} vendors`);
    }
  }
);

// Check results
results.forEach(({ success, item, result, error }) => {
  if (success) {
    console.log(`✅ ${item.name} created with ID: ${result.id}`);
  } else {
    console.error(`❌ ${item.name} failed:`, error);
  }
});
```

### Workflow 4: Search with Debounce

```typescript
import { debounce } from '@/services/apiHelpers';
import { vendorService } from '@/services';

// Create debounced search (waits 300ms after user stops typing)
const debouncedSearch = debounce(async (query: string) => {
  if (!query) return;
  
  const results = await vendorService.getAllVendors({ name: query });
  console.log('Search results:', results.data);
}, 300);

// In input event handler:
// input.addEventListener('input', e => debouncedSearch(e.target.value));
```

### Workflow 5: Track PO Payments with Retry

```typescript
import { withRetry } from '@/services/apiHelpers';
import { poService } from '@/services';

// Retry payment fetch up to 3 times if it fails
const payments = await withRetry(
  () => poService.getPayments(poId),
  3,      // max retries
  1000,   // initial delay in ms
  'Fetch PO Payments'
);

console.log('Payments:', payments);
```

---

## ⚠️ Error Handling

### Error Types You'll Encounter

```typescript
import {
  APIError,
  ValidationError,
  NetworkError,
  TimeoutError,
  getErrorMessage
} from '@/services';

// Handle all error types
try {
  await someAPICall();
} catch (error) {
  const message = getErrorMessage(error);

  if (error instanceof ValidationError) {
    // Show field-level errors
    Object.entries(error.fields).forEach(([field, msg]) => {
      console.error(`${field}: ${msg}`);
    });
  } else if (error instanceof APIError && error.status === 422) {
    // Unprocessable entity
    console.error('Validation failed:', error.details);
  } else if (error instanceof NetworkError) {
    // Show "check internet connection" message
    console.error('Network unavailable');
  } else if (error instanceof TimeoutError) {
    // Show "try again" message
    console.error('Request timeout');
  } else {
    // Generic error
    console.error(message);
  }
}
```

### Common Error Scenarios

```typescript
// Scenario 1: 422 Validation Error
// BackendReturns: { error: 'Validation failed', details: { email: 'Invalid email' } }
// Frontend receives: ValidationError with fields: { email: 'Invalid email' }

// Scenario 2: 401 Unauthorized
// Backend returns: 401 with error message
// Frontend: Automatically clears token and logs out user

// Scenario 3: Network Error
// Cause: Backend offline, no internet connection
// Frontend: Shows retry option automatically

// Scenario 4: Timeout
// Cause: Request took > 30 seconds
// Frontend: Throws TimeoutError, user can retry
```

---

## ✨ Best Practices

### ✓ Do This

```typescript
// ✅ Use apiClient for all HTTP calls
const response = await apiClient.get('/api/projects');

// ✅ Handle errors appropriately
try {
  // API call
} catch (error) {
  if (error instanceof APIError && error.status === 409) {
    // Resource conflict - specific handling
  }
}

// ✅ Use helpers for common operations
const results = await batchOperation(items, processor);

// ✅ Validate input before sending
if (!validators.isValidEmail(email)) {
  throw new Error('Invalid email');
}

// ✅ Use debounce for frequent events
const debouncedSearch = debounce(search, 300);

// ✅ Clear cache when needed
apiClient.clearCache();
```

### ✗ Don't Do This

```typescript
// ❌ Don't use fetch directly
const response = await fetch(url);

// ❌ Don't ignore errors
try {
  await apiCall();
} catch (e) {
  // Don't ignore!
}

// ❌ Don't send `any` type data without validation
await apiClient.post('/api/vendors', vendorData);

// ❌ Don't make API calls in loops without batching
for (const vendor of vendors) {
  await vendorService.createVendor(vendor); // Slow!
}

// ❌ Don't make API calls on every keystroke
input.addEventListener('input', async (e) => {
  await search(e.target.value); // Too many requests!
});
```

---

## 🔍 Debugging & Monitoring

### View All Request Logs

```typescript
import { requestLogger } from '@/services';

// Get request history
const history = requestLogger.getHistory();
history.forEach(log => {
  console.log(`[${log.id}] ${log.method} ${log.url}`);
  console.log(`  Status: ${log.status}`);
  console.log(`  Duration: ${log.duration}ms`);
  if (log.error) console.log(`  Error: ${log.error}`);
});
```

### Export Logs for Analysis

```typescript
import { diagnostics } from '@/services/apiHelpers';

// Export all logs as JSON
const logs = diagnostics.exportLogs();
console.log(logs);

// Save to file (for support)
const blob = new Blob([logs], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'api-logs.json';
a.click();
```

### Monitor API Performance

```typescript
// Check for slow requests
const summary = diagnostics.getSummary();
if (summary.averageDuration > 2000) {
  console.warn('API is slow:', summary.averageDuration + 'ms average');
}

// Check for errors
if (summary.errorRate > 0.1) {
  console.warn('High error rate:', (summary.errorRate * 100).toFixed(2) + '%');
}
```

### Debug Specific Request

```typescript
import { requestLogger } from '@/services';

// Find requests for a specific endpoint
const history = requestLogger.getHistory();
const poRequests = history.filter(r => r.url.includes('/po'));

// Check if there were errors
const errors = poRequests.filter(r => r.error);
console.log('PO requests errors:', errors);
```

---

## ✅ Production Checklist

Before deploying to production:

### Configuration
- [ ] Set `BASE_URL` to production backend: `https://api.nexgen.com`
- [ ] Set `TIMEOUT` to appropriate value (30 seconds)
- [ ] Disable verbose logging in production build
- [ ] Set `NODE_ENV` to 'production'

### Security
- [ ] API key stored securely (environment variables)
- [ ] HTTPS enforced for all requests
- [ ] Auth tokens stored in httpOnly cookies or secure storage
- [ ] Credentials not logged or leaked

### Error Handling
- [ ] All API errors caught and displayed to users
- [ ] Retry logic configured appropriately
- [ ] Timeout errors show helpful message
- [ ] Network errors suggest connection troubleshooting

### Performance
- [ ] Response caching enabled
- [ ] API calls debounced/throttled appropriately
- [ ] Batch operations used for bulk actions
- [ ] Pagination implemented for large lists

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] API metrics logged
- [ ] Performance tracking enabled
- [ ] Slow request monitoring in place

### Testing
- [ ] All main workflows tested end-to-end
- [ ] Error scenarios tested (network down, timeout, validation)
- [ ] File uploads tested
- [ ] Large data sets tested
- [ ] Mobile network simulation tested

---

## 🚀 Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Environment Configuration
```bash
# .env.production
VITE_API_BASE_URL=https://api.nexgen.com
VITE_API_TIMEOUT=30000
```

### 3. Serve with HTTPS
```bash
# Use nginx, Vercel, or similar to serve with HTTPS
```

### 4. Monitor in Production
```typescript
// Enable error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1
});
```

---

## 📞 Support & Resources

### Getting Help
1. Check request logs: `diagnostics.getErrorHistory()`
2. Export logs: `diagnostics.exportLogs()`
3. Check backend logs: `ssh backend-server && tail -f logs.txt`
4. Review backend API docs: `Backend/docs/API.md`

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "CORS Error" | Ensure backend has CORS enabled for frontend origin |
| "401 Unauthorized" | Check auth token: `localStorage.getItem('auth_token')` |
| "Network Error" | Check backend is running: `curl http://localhost:8000/health` |
| "422 Validation Error" | Check request payload matches backend expectations |
| "Timeout" | Increase timeout or check backend performance |
| "Blank Page" | Check browser console for errors: `F12` |

### Useful Commands

```typescript
// Check if backend is up
await healthService.checkHealth();

// View all API logs
diagnostics.exportLogs();

// Clear logs
diagnostics.clearLogs();

// Test an endpoint
await apiClient.get('/api/projects', { bypassCache: true });

// View request summary
console.log(diagnostics.getSummary());
```

---

## 🎉 You're All Set!

Your NexGen Finances frontend is now fully integrated with the backend with:

✅ **Automatic error handling**  
✅ **Request retry logic**  
✅ **Response caching**  
✅ **Performance monitoring**  
✅ **Comprehensive logging**  
✅ **Helper utilities**  
✅ **Best practices implemented**  

**Ready for production deployment!**

---

*For questions, see [Backend Documentation](../Backend/docs/API.md) or check the integration guide in this repo.*
