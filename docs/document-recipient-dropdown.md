# Document Recipient Dropdown

*Implemented: 2025-05-28*

## 🎯 Feature Overview

Added a tenant alias dropdown to the document details page, replacing the static "Your Company" text with a dynamic dropdown that allows users to manually assign documents to specific tenant profiles.

## ✨ Key Features

### **Smart Dropdown**
- Shows all available tenant aliases with type indicators
- Displays "(Company)" or "(Individual)" next to each option
- Includes a "Select recipient..." placeholder option
- Loading state while fetching tenant data

### **Visual Integration**
- **Edit Mode**: Full dropdown with all tenant options
- **View Mode**: Shows tenant icon, alias, and full name with proper type styling
- **Fallback**: Displays original recipient text if no tenant match found
- **Empty State**: Shows "Unknown Recipient" if no data available

### **Backend Integration**
- Uses existing Document.recipient field (no database changes needed)
- Leverages existing `/api/documents/{id}` PUT endpoint
- Maintains compatibility with existing document data

## 🔧 Technical Implementation

### **Frontend Changes**
- **Component**: `DocumentPreviewIntegrated.tsx`
- **Hook**: Uses `useTenants()` for tenant data
- **State**: Integrated with existing form state management
- **API**: Uses existing `documentApi.updateDocument()` method

### **Edit Mode**
```typescript
<select
  name="recipient"
  value={formData.recipient}
  onChange={handleChange}
  className="form-select w-full text-gray-900 dark:text-gray-400"
>
  <option value="">Select recipient...</option>
  {tenants.map((tenant) => (
    <option key={tenant.id} value={tenant.alias}>
      {tenant.alias} ({tenant.type === 'company' ? 'Company' : 'Individual'})
    </option>
  ))}
</select>
```

### **View Mode Rendering**
- Matches tenant alias against document.recipient field
- Shows appropriate icon (Building2 for companies, User for individuals)
- Displays full tenant information including name and alias
- Graceful fallback for unmatched recipients

## 🎨 User Experience

### **Workflow**
1. User opens document details
2. Clicks "Edit" button
3. Sees recipient dropdown with all tenant options
4. Selects appropriate tenant alias
5. Clicks "Save" to update document
6. View mode shows selected tenant with proper branding

### **Visual Indicators**
- **Company tenants**: Blue building icon + alias + "(Company)"
- **Individual tenants**: Green user icon + alias + "(Individual)"
- **Matched recipient**: Full tenant info with proper styling
- **Unmatched recipient**: Generic user icon with original text

## 🚀 Benefits

1. **Manual Assignment**: Users can assign documents to specific tenants
2. **Visual Clarity**: Clear indication of which tenant owns each document
3. **Type Safety**: Proper validation and display of tenant types
4. **Backward Compatibility**: Works with existing document data
5. **Consistent UX**: Matches the tenant management interface styling

## 📋 Use Cases

### **Multi-Tenant Scenarios**
- Personal invoices → Assign to "Personal" tenant
- Business invoices → Assign to "My Company" tenant  
- Client work → Assign to "Consulting LLC" tenant
- Family documents → Assign to "Family" tenant

### **Document Organization**
- Clearly see which entity each document belongs to
- Easily reassign documents if initially categorized incorrectly
- Visual distinction between personal and business documents
- Support for complex multi-entity accounting setups

## 🔄 Data Flow

1. **Load**: Component fetches tenants via `useTenants()` hook
2. **Display**: Shows current recipient in view/edit mode
3. **Edit**: User selects new tenant from dropdown
4. **Save**: API call updates document.recipient field with selected alias
5. **Refresh**: UI updates to show new tenant assignment

---

*This feature bridges the gap between the tenant management system and document organization, providing clear ownership and assignment capabilities for multi-tenant document processing.* 