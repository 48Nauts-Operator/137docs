# Tenant Extraction Agent

*Implemented: 2025-05-28*
*Enhanced: 2025-05-28 - Robust Error Handling*
*Security Update: 2025-05-28 - Manual Tenant Creation Only*

## 🎯 **Intelligent Document-to-Tenant Assignment**

The Tenant Extraction Agent automatically analyzes document content to identify recipients and assign documents to **existing** tenant profiles. It combines AI-powered analysis with rule-based fallbacks for maximum reliability.

**🔒 SECURITY RULE**: The agent **NEVER** creates new tenants automatically. Tenant creation is a **manual-only** process for security and data integrity.

## 🧠 **Core Intelligence Features**

### **LLM-Powered Analysis**
- **Content Analysis**: Examines document text for recipient patterns
- **Pattern Recognition**: Identifies "To:" sections, letterheads, address blocks
- **Swiss/European Support**: Special handling for legal documents and European formats
- **Confidence Scoring**: Only processes high-confidence extractions (>50%)

### **Enhanced JSON Parsing** ⭐ *New*
- **Multi-Strategy Parsing**: 3-tier approach to handle malformed LLM responses
- **Automatic Cleanup**: Fixes common JSON issues (trailing commas, quotes, etc.)
- **Robust Error Handling**: Graceful degradation when parsing fails
- **Debug Logging**: Detailed logging for troubleshooting problematic responses

### **Rule-Based Fallback**
- **Swiss Legal Documents**: Special patterns for "Unsere Referenz", "Gläubiger", etc.
- **Standard Patterns**: Bill-to sections, company suffixes, personal titles
- **Proper Noun Detection**: Last-resort extraction of potential names
- **Content Validation**: Filters out email addresses, phone numbers, etc.

## 🔧 **Enhanced Error Handling**

### **JSON Response Processing**
```python
# Strategy 1: Direct JSON parsing
try:
    tenant_data = json.loads(response)
except json.JSONDecodeError:
    pass

# Strategy 2: Pattern extraction
json_patterns = [
    r'\{.*\}',  # Standard JSON block
    r'```json\s*(\{.*?\})\s*```',  # Markdown code block
    r'JSON[:\s]*(\{.*?\})',  # After "JSON:" label
]

# Strategy 3: Automatic cleanup
cleaned_response = self._clean_json_response(response)
```

### **Data Normalization**
- **Type Validation**: Ensures all fields are proper types
- **Required Field Checks**: Validates name/alias presence
- **Nested Structure Handling**: Safely processes address, contact, business info
- **Empty Field Removal**: Cleans up null/empty values

### **Confidence Validation**
- **Minimum Threshold**: Rejects extractions below 50% confidence
- **Smart Skipping**: Avoids processing documents that already have good recipients
- **Graceful Failures**: Returns structured error responses instead of crashing

## 🎯 **Document Type Support**

### **Swiss Legal Documents** ⭐ *Enhanced*
- **Caisse Juridique Suisse**: Handles legal correspondence patterns
- **Reference Sections**: Extracts from "Unsere Referenz" fields
- **Client Information**: Identifies addressee information in headers
- **Multi-language**: Supports German, French legal document formats

### **Standard Business Documents**
- **Invoices**: Bill-to and recipient sections
- **Correspondence**: Letter addressees and signatures
- **Contracts**: Party identification
- **Reports**: Prepared-for sections

## 🔄 **Processing Flow**

### **1. Document Analysis**
```
Document → Content Extraction → LLM Analysis → JSON Parsing → Validation
```

### **2. Fallback Chain**
```
LLM Fails → Rule-Based Extraction → Proper Noun Detection → Manual Review
```

### **3. Tenant Matching**
```
Extracted Info → Fuzzy Matching → Update Existing OR Create New → Assignment
```

## 📊 **Confidence Scoring**

| Confidence | Criteria | Action |
|------------|----------|---------|
| 0.9-1.0 | Clear recipient with full address | Auto-assign |
| 0.7-0.8 | Clear name, limited address | Auto-assign |
| 0.5-0.6 | Partial information available | Auto-assign |
| <0.5 | Unclear or insufficient data | Skip processing |

## 🛡️ **Error Resilience**

### **Robust JSON Handling**
- **Malformed Response Recovery**: Automatically fixes common LLM JSON errors
- **Multiple Extraction Strategies**: Tries different parsing approaches
- **Graceful Degradation**: Falls back to rule-based extraction on LLM failure

### **Processing Safeguards**
- **Document Validation**: Checks document exists before processing
- **Duplicate Prevention**: Skips documents with existing good recipients
- **Transaction Safety**: Database operations wrapped in proper error handling

### **Logging & Debugging**
- **Detailed Logging**: Debug-level logging for response parsing
- **Error Context**: Includes problematic response text in error logs
- **Performance Tracking**: Confidence scores and processing times logged

## 🎛️ **Configuration Options**

### **Confidence Thresholds**
```python
MIN_CONFIDENCE = 0.5  # Minimum for processing
HIGH_CONFIDENCE = 0.8  # Auto-create new tenants
FUZZY_MATCH_THRESHOLD = 0.8  # Tenant matching
```

### **Processing Limits**
```python
CONTENT_TRUNCATION = 4000  # Characters for LLM analysis
BATCH_SIZE = 10  # Documents per batch operation
```

## 🚀 **Usage Examples**

### **Single Document Processing**
```python
agent = TenantExtractionAgent(db_session)
result = await agent.analyze_and_assign_tenant(document_id, user_id)

if result["status"] == "success":
    print(f"Assigned to: {result['tenant']['alias']}")
    print(f"Confidence: {result['confidence']}")
```

### **Error Handling**
```python
if result["status"] == "error":
    logger.error(f"Processing failed: {result['message']}")
elif result["status"] == "no_match":
    logger.info(f"No tenant found: {result['message']}")
```

## 🎉 **Benefits**

- **High Reliability**: Multi-tier error handling prevents processing failures
- **Swiss Document Support**: Specialized handling for European legal documents
- **Intelligent Matching**: Fuzzy matching prevents duplicate tenant creation
- **Graceful Degradation**: Always returns useful results, even on partial failures
- **Debug-Friendly**: Comprehensive logging for troubleshooting
- **Performance Optimized**: Efficient content truncation and batch processing

The enhanced Tenant Extraction Agent now handles even the most challenging documents, including Swiss legal correspondence, with robust error recovery and intelligent fallback mechanisms. 