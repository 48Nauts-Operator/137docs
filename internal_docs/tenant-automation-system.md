# Tenant Automation System

*Implemented: 2025-05-28*

## 🎯 Complete Automated Tenant Processing

The Tenant Automation System provides multiple automated trigger points for intelligent tenant extraction and document assignment, delivering a seamless experience where documents are automatically organized by tenant profiles.

## 🔄 **Automation Trigger Points**

### **1. Real-Time Document Upload Processing**
- **When**: Every time a document is uploaded (file upload or folder watching)
- **Where**: `src/backend/app/main.py` - `process_new_document()` function
- **How**: Automatically runs after OCR and metadata extraction
- **Features**:
  - Enhanced user detection (finds active users automatically)
  - Updates document recipient field with extracted tenant alias
  - Graceful fallback if tenant extraction fails
  - Logging for full audit trail

### **2. Manual Single Document Processing**
- **When**: User clicks "Smart Recipient" button (👤✓) in document preview
- **Where**: Document preview interface
- **How**: Calls `/llm/extract-tenant/{document_id}` endpoint
- **Features**:
  - Real-time processing with loading states
  - Success feedback with tenant details
  - Automatic UI refresh after assignment

### **3. Batch Processing for All Unassigned Documents**
- **When**: User clicks "Run Batch Processing" in Settings > Automation
- **Where**: New automation tab in settings
- **How**: Processes all documents with empty/generic recipients
- **Features**:
  - Finds documents with recipients like "Your Company", empty, etc.
  - Processes up to 50 documents at a time with batching
  - Real-time progress display
  - Detailed results breakdown

### **4. Smart Auto-Assignment for Pattern-Based Documents**
- **When**: User clicks "Run Auto-Assignment" in Settings > Automation  
- **Where**: New automation tab in settings
- **How**: Targets documents with corporate suffixes (Inc., Ltd., GmbH, AG)
- **Features**:
  - Pattern-based document discovery
  - Intelligent matching against existing tenant profiles
  - Bulk processing with progress tracking

### **5. Enhanced LLM Document Processing**
- **When**: User clicks "Process with AI" button (🧠) in document preview
- **Where**: Document preview interface
- **How**: Includes tenant extraction in comprehensive LLM processing
- **Features**:
  - Combined metadata extraction, tagging, analysis, and tenant assignment
  - Single-click complete document processing
  - Integrated workflow for maximum efficiency

## 🎛️ **Control Interface - Settings > Automation**

### **Smart Auto-Assignment Card**
```
🤖 Smart Auto-Assignment
- Automatically assign unmatched documents to tenant profiles
- Finds documents with generic recipients like "Your Company", "Inc.", etc.
- Attempts to match with existing tenant profiles based on content
[Run Auto-Assignment] button
```

### **Batch Tenant Extraction Card**
```
💾 Batch Tenant Extraction  
- Process all documents without tenant assignments
- Analyzes document content using AI to extract recipient information
- Automatically creates or assigns tenant profiles
[Run Batch Processing] button
```

### **Results Display Panel**
```
📊 Processing Results
┌─────────────┬─────────────┬─────────────┐
│ Processed   │ Skipped     │ Errors      │
│    15       │     3       │     0       │
└─────────────┴─────────────┴─────────────┘
"Batch processing completed: 15 processed, 3 skipped, 0 errors"
```

## 🧠 **Intelligent Agent Logic**

### **TenantExtractionAgent Features**
- **LLM-Powered Analysis**: Uses configured LLM to analyze document content
- **Pattern Recognition**: Identifies recipient sections, letterheads, "To:" fields
- **Smart Matching**: Fuzzy matching against existing tenant profiles  
- **Auto-Creation**: Creates new tenant profiles when no match exists (>70% confidence)
- **Confidence Scoring**: Only processes high-confidence extractions
- **Fallback Logic**: Rule-based extraction when LLM unavailable

### **Processing Intelligence**
- **User Context**: Automatically detects appropriate user for tenant assignment
- **Duplicate Prevention**: Checks existing tenant aliases before creating new ones
- **Content Validation**: Ensures extracted tenant data meets quality thresholds
- **Error Handling**: Graceful degradation with detailed error reporting

## 📋 **API Endpoints**

### **Single Document Processing**
```http
POST /api/llm/extract-tenant/{document_id}
```

### **Batch Processing**  
```http  
POST /api/llm/batch-extract-tenants
{
  "document_ids": [1, 2, 3],  // Optional: specific documents
  "all_documents": true       // Or: process all unassigned
}
```

### **Auto-Assignment**
```http
POST /api/llm/auto-assign-unmatched  
```

## 🔧 **Configuration**

### **Backend Settings**
- **Batch Size**: 10 documents per batch (configurable in agent)
- **User Detection**: Auto-finds first active user for processing
- **Confidence Threshold**: 50% minimum for tenant extraction
- **Fallback Behavior**: Graceful degradation if LLM unavailable

### **Frontend Integration**
- **Real-time Updates**: Document tables refresh automatically after tenant assignment
- **Loading States**: Visual feedback during processing operations
- **Error Handling**: User-friendly error messages and retry options

## 🎯 **User Experience Flow**

### **New Document Upload**
1. User uploads document → System processes with OCR
2. **Automatic tenant extraction runs in background**
3. Document appears in correct tenant filter immediately
4. User sees organized documents without manual intervention

### **Existing Document Processing**
1. User notices unassigned documents in "All Documents" view
2. Goes to Settings > Automation tab
3. Runs "Batch Processing" for comprehensive assignment
4. Reviews results and sees documents now properly organized

### **Manual Fine-Tuning**
1. User opens specific document in preview
2. Clicks "Smart Recipient" button for targeted processing
3. System analyzes and assigns/creates tenant profile
4. Document immediately moves to correct tenant context

## 🎉 **Benefits**

- **Zero Manual Work**: New documents automatically organized by tenant
- **Bulk Processing**: Handle hundreds of existing documents effortlessly  
- **Intelligent Matching**: AI-powered recipient analysis with high accuracy
- **Complete Automation**: From upload to organization with no user intervention
- **Visual Feedback**: Clear progress tracking and result reporting
- **Flexible Control**: Multiple trigger points for different use cases

The Tenant Automation System transforms document management from manual organization to intelligent, automated tenant-based filing that scales effortlessly with your document volume.

## 🔗 **Related Documentation**

- [Tenant Profile Implementation](./tenant-profile-implementation.md)
- [Tenant Extraction Agent](./tenant-extraction-agent.md)  
- [Tenant Filtering Feature](./tenant-filtering-feature.md)
- [LLM Integration Guide](./llm-integration.md) 