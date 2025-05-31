# DocAI-IMAGE Platform Flight Check

A comprehensive health check system available from the Settings/Preferences page to diagnose platform issues and verify system functionality.

## Purpose
When the platform is not working correctly, run this flight check to identify the root cause and get specific remediation steps.

---

## 🏥 **CRITICAL SYSTEM CHECKS**

### 1. **Database Connectivity**
- [ ] **Database Connection** - Can connect to PostgreSQL
- [ ] **Database Schema** - All required tables exist
  - `documents`, `users`, `entities`, `user_entities`, `tags`, `document_tags`
  - `llm_configs`, `processing_rules`, `vectors`, `addresses`
  - `notifications`, `settings`, `user_sessions`
- [ ] **Database Indexes** - Performance indexes are present
- [ ] **Migration Status** - All Alembic migrations applied
- [ ] **Default Data** - Required seed data exists (default tenant, admin user)

**API Test**: `GET /api/health` → `{"database": "healthy"}`

### 2. **Authentication & Authorization**
- [ ] **JWT Service** - Token generation and validation working
- [ ] **User Sessions** - Active session management
- [ ] **Admin Access** - Admin user can authenticate
- [ ] **Permission System** - Role-based access control functional
- [ ] **Password Security** - Hashing and validation working

**API Test**: `POST /api/auth/login` with admin credentials

### 3. **Document Processing Pipeline**
- [ ] **File Upload** - Documents can be uploaded successfully
- [ ] **OCR Service** - Text extraction from PDFs and images
- [ ] **Metadata Extraction** - Document parsing and analysis
- [ ] **Storage System** - Files saved correctly in filesystem
- [ ] **Document Status** - Proper workflow state management

**API Test**: Upload test document via `POST /api/documents`

---

## 🤖 **AI & LLM SERVICES**

### 4. **LLM Configuration**
- [ ] **LLM Provider Set** - Ollama/OpenAI/Anthropic configured
- [ ] **LLM Connection** - Can connect to configured provider
- [ ] **Model Availability** - Required models accessible
  - Tagger model (for classification)
  - Enricher model (for metadata)
  - Analytics model (for insights)
- [ ] **API Authentication** - Valid API keys for external providers

**API Test**: `GET /api/llm/status` → `{"enabled": true, "provider": "..."}`

### 5. **ColVision Embeddings**
- [ ] **ColVision Service** - Visual document embedding service running
- [ ] **Qdrant Vector DB** - Vector database accessible
- [ ] **Vector Generation** - Documents can be embedded
- [ ] **Vector Search** - Similarity search working
- [ ] **Vector Storage** - Embeddings persisted correctly

**API Test**: `POST /api/search/vision` with test query

### 6. **Tenant Extraction**
- [ ] **Tenant Agent** - AI agent for recipient detection
- [ ] **Fuzzy Matching** - Tenant matching algorithm working
- [ ] **Pattern Recognition** - Document letterhead analysis
- [ ] **Auto-Assignment** - Documents assigned to correct tenants
- [ ] **Confidence Scoring** - Extraction confidence calculation

**Manual Test**: Process document with clear recipient information

---

## 📁 **FILE SYSTEM & PROCESSING**

### 7. **Folder Configuration**
- [ ] **Inbox Folder** - Configured and accessible
- [ ] **Storage Root** - Storage directory writable
- [ ] **Folder Structure** - Yearly/Archive folders exist
- [ ] **File Permissions** - Read/write access to all paths
- [ ] **Path Validation** - Folder paths exist and valid

**API Test**: `POST /api/settings/validate-folders`

### 8. **Folder Watcher**
- [ ] **Watcher Service** - File system monitoring active
- [ ] **Hot Reload** - Changes to inbox path update watcher
- [ ] **File Detection** - New files trigger processing
- [ ] **Event Processing** - File events handled correctly
- [ ] **Error Recovery** - Watcher recovers from failures

**API Test**: `GET /api/health` → `{"watcher": "healthy"}`

### 9. **Processing Rules Engine**
- [ ] **Rule Engine** - Document processing rules system
- [ ] **Rule Evaluation** - Conditions properly evaluated
- [ ] **Action Execution** - Rule actions applied correctly
- [ ] **Priority System** - Rules execute in correct order
- [ ] **Rule Testing** - Can test rules against documents

**API Test**: `GET /api/processing/rules` returns configured rules

---

## 👤 **MULTI-TENANT SYSTEM**

### 10. **Tenant Management**
- [ ] **Tenant Setup** - At least one tenant configured
- [ ] **Default Tenant** - Default tenant assigned
- [ ] **User-Tenant Association** - Users linked to tenants
- [ ] **Tenant Switching** - Can switch between tenants
- [ ] **Tenant Isolation** - Documents filtered by tenant

**API Test**: `GET /api/tenants/default` returns tenant data

### 11. **Entity System**
- [ ] **Entity Table** - Core tenant data storage
- [ ] **User Entities** - User-tenant relationships
- [ ] **Entity Types** - Company vs Individual classification
- [ ] **Default Flags** - Proper default tenant marking
- [ ] **Active Status** - Soft delete system working

**Database Test**: Check `entities` and `user_entities` tables

---

## 📊 **ANALYTICS & REPORTING**

### 12. **Analytics Service**
- [ ] **Financial Analytics** - Spending/revenue calculations
- [ ] **Document Statistics** - Processing metrics
- [ ] **Vendor Analytics** - Supplier spending analysis
- [ ] **Payment Tracking** - Invoice status monitoring
- [ ] **KPI Calculations** - Dashboard metrics accurate

**API Test**: `GET /api/analytics/spending-trend`

### 13. **Dashboard Components**
- [ ] **Health Status** - System status indicators
- [ ] **Processing Status** - Document pipeline status
- [ ] **Chart Data** - Analytics visualizations
- [ ] **Real-time Updates** - Live data refresh
- [ ] **Error Boundaries** - Frontend error handling

**Frontend Test**: Dashboard loads without JavaScript errors

---

## 🔧 **INTEGRATION SERVICES**

### 14. **Search Functionality**
- [ ] **Full-text Search** - Document content search
- [ ] **Metadata Search** - Search by document fields
- [ ] **Advanced Filters** - Date ranges, amounts, status
- [ ] **Search Indexing** - Search performance optimized
- [ ] **Faceted Search** - Multi-criteria search

**API Test**: `GET /api/search?q=test` returns results

### 15. **Notification System**
- [ ] **Notification Engine** - Alert generation system
- [ ] **Due Date Alerts** - Invoice due date notifications
- [ ] **Processing Alerts** - Document processing notifications
- [ ] **System Alerts** - Error and status notifications
- [ ] **Notification Delivery** - Notifications properly sent

**API Test**: Check notification queue and delivery

### 16. **Calendar Integration**
- [ ] **ICS Export** - Calendar file generation
- [ ] **Due Date Calendar** - Invoice due dates in calendar
- [ ] **Calendar Sync** - External calendar integration
- [ ] **Date Formatting** - Proper date/time handling
- [ ] **Timezone Support** - Correct timezone conversion

**API Test**: `GET /api/calendar/export.ics` generates valid ICS

---

## 🚀 **PERFORMANCE & RELIABILITY**

### 17. **Performance Checks**
- [ ] **Database Performance** - Query execution times
- [ ] **File Upload Speed** - Document upload performance
- [ ] **Processing Throughput** - Documents per minute
- [ ] **Memory Usage** - System memory consumption
- [ ] **CPU Utilization** - Processing load monitoring

**Metrics**: Check system resource usage during operation

### 18. **Error Handling**
- [ ] **Error Boundaries** - Frontend error isolation
- [ ] **API Error Responses** - Proper HTTP status codes
- [ ] **Logging System** - Comprehensive error logging
- [ ] **Fallback Mechanisms** - Graceful degradation
- [ ] **Recovery Procedures** - Automatic error recovery

**Test**: Trigger various error conditions and verify handling

### 19. **Security Checks**
- [ ] **Input Validation** - XSS and injection protection
- [ ] **File Upload Security** - Malicious file filtering
- [ ] **Authentication Security** - JWT token security
- [ ] **Authorization Checks** - Proper access control
- [ ] **Data Encryption** - Sensitive data protection

**Security Test**: Attempt various security exploits

---

## 🌐 **FRONTEND & UI**

### 20. **React Application**
- [ ] **Frontend Build** - Application compiles successfully
- [ ] **Component Rendering** - All components load correctly
- [ ] **State Management** - Application state consistent
- [ ] **Routing** - Page navigation working
- [ ] **Responsive Design** - Mobile/tablet compatibility

**Browser Test**: Navigate through all application pages

### 21. **API Integration**
- [ ] **HTTP Client** - API requests working
- [ ] **Error Handling** - API errors handled gracefully
- [ ] **Loading States** - User feedback during requests
- [ ] **Data Persistence** - State persists across sessions
- [ ] **Real-time Updates** - Live data synchronization

**Network Test**: Monitor browser network tab for API calls

---

## 📋 **CONFIGURATION & SETTINGS**

### 22. **System Configuration**
- [ ] **Environment Variables** - All required env vars set
- [ ] **Docker Containers** - All services running
- [ ] **Service Discovery** - Internal service communication
- [ ] **Port Configuration** - Services accessible on correct ports
- [ ] **SSL/TLS Setup** - HTTPS configuration (if enabled)

**Container Test**: `docker-compose ps` shows all services healthy

### 23. **User Preferences**
- [ ] **Settings Storage** - User preferences saved
- [ ] **Theme Switching** - Dark/light mode working
- [ ] **Language Support** - Internationalization functional
- [ ] **Column Preferences** - Table customization saved
- [ ] **Default Values** - Proper default configurations

**Settings Test**: Change and verify settings persistence

---

## 🔍 **DIAGNOSTIC PROCEDURES**

### **Flight Check Execution**

1. **Quick Health Check** (30 seconds)
   - API health endpoint
   - Database connectivity
   - Frontend loading
   - Basic authentication

2. **Comprehensive Check** (5 minutes)
   - All system components
   - Full functionality testing
   - Performance validation
   - Integration verification

3. **Deep Diagnostic** (15 minutes)
   - Complete end-to-end testing
   - Load testing
   - Security validation
   - Data integrity checks

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| White Screen | Frontend not loading | Check React error boundary, clear cache |
| Database Error | 500 errors on API calls | Verify database connection and migrations |
| LLM Not Working | No metadata extraction | Check LLM configuration and connectivity |
| File Upload Fails | Cannot upload documents | Verify folder permissions and storage |
| Tenant Missing | No default tenant | Create default tenant and user association |
| Processing Stuck | Documents stuck in processing | Restart processing workers |

### **Health Status Indicators**

- 🟢 **Green**: All systems operational
- 🟡 **Yellow**: Minor issues, degraded performance
- 🔴 **Red**: Critical failure, service unavailable
- ⚪ **Gray**: Service disabled or not configured

---

## 🛠️ **IMPLEMENTATION NOTES**

### **Flight Check API Endpoints**

```typescript
// Core health check
GET /api/flight-check/quick
GET /api/flight-check/comprehensive  
GET /api/flight-check/diagnostic

// Component-specific checks
GET /api/flight-check/database
GET /api/flight-check/llm
GET /api/flight-check/processing
GET /api/flight-check/storage
```

### **Frontend Integration**

- Add "Flight Check" section to Settings page
- Real-time progress indicators during checks
- Detailed results with specific remediation steps
- Export diagnostic report for troubleshooting

### **Automated Monitoring**

- Schedule periodic health checks
- Alert on critical component failures
- Trend analysis for performance degradation
- Integration with external monitoring systems

---

**Status**: 📋 **SPECIFICATION COMPLETE**  
**Next Phase**: Implementation of flight check system  
**Target Integration**: Settings/Preferences page with real-time diagnostics