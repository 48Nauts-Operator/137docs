# Demo User Implementation Guide

*Last updated: 2025-05-25*

---

## 1. Overview

This document outlines the implementation of a **DEMO user** feature that allows users to log in with `demo/demo` credentials and experience the application with realistic fake data, completely isolated from production data.

### Goals
- **Sales & Marketing** – Live demos without exposing real customer data
- **User Onboarding** – New users see a populated interface immediately
- **Development** – Consistent test data across environments
- **Trade Shows** – Self-service demo without setup

---

## 2. Architecture

### 2.1 Demo User Role
- **Username**: `demo`
- **Password**: `demo`
- **Role**: `demo` (new role type)
- **Permissions**: Read-only access to demo data, no file uploads, limited settings

### 2.2 Data Isolation Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real Users    │    │   Demo User     │    │   Admin Users   │
│   (admin/viewer)│    │   (demo)        │    │   (admin)       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ entity_id: 1,2,3│    │ entity_id: -1   │    │ All entities    │
│ Real documents  │    │ Fake documents  │    │ User management │
│ Real invoices   │    │ Fake invoices   │    │ Settings        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key principle**: Demo data uses `entity_id = -1` (special demo entity) for complete isolation.

---

## 3. Backend Implementation

### 3.1 Database Schema Changes

#### Add Demo Entity
```sql
-- Alembic migration: add demo entity
INSERT INTO entities (id, name, type, vat_id, iban, aliases, created_at) 
VALUES (-1, 'Demo Company Ltd.', 'company', 'DEMO123456', 'DEMO-IBAN-123', 
        ARRAY['Demo Corp', 'Demo Ltd'], NOW());
```

#### Demo User Seeding
```python
# In src/backend/app/main.py startup function
demo_user = {
    "username": "demo",
    "email": "demo@example.com",
    "full_name": "Demo User",
    "role": "demo",
    "hashed_password": get_password_hash("demo"),
    "disabled": False,
}
```

### 3.2 Auth Middleware Updates

#### Role Definition
```python
# In src/backend/app/auth.py
VALID_ROLES = ["admin", "viewer", "demo"]

def get_demo_entity_filter(user: User) -> Optional[int]:
    """Return entity_id filter for demo users."""
    if user.role == "demo":
        return -1  # Demo entity only
    return None  # No filter for regular users
```

#### Permission Decorator
```python
# New decorator for demo-restricted endpoints
def demo_readonly(func):
    """Decorator to block demo users from write operations."""
    async def wrapper(*args, **kwargs):
        current_user = kwargs.get('current_user')
        if current_user and current_user.role == "demo":
            raise HTTPException(
                status_code=403, 
                detail="Demo users cannot perform this action"
            )
        return await func(*args, **kwargs)
    return wrapper
```

### 3.3 Data Seeding Service

#### Demo Data Generator
```python
# New file: src/backend/app/services/demo_seeder.py
import random
from datetime import datetime, timedelta
from faker import Faker

class DemoDataSeeder:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.fake = Faker()
        
    async def seed_all(self):
        """Seed all demo data."""
        await self.seed_documents()
        await self.seed_invoices()
        await self.seed_address_book()
        await self.seed_notifications()
        
    async def seed_documents(self):
        """Create 25-30 realistic demo documents."""
        demo_docs = [
            {
                "title": "Invoice #INV-2024-001",
                "sender": "Acme Software Solutions",
                "document_type": "invoice",
                "amount": 2450.00,
                "currency": "USD",
                "status": "paid",
                "document_date": "2024-01-15",
                "due_date": "2024-02-15",
                "entity_id": -1,
                "hash": f"demo_hash_{i}",
                "file_path": "/demo/invoices/acme_001.pdf",
                "summary": "Software licensing and support services",
            },
            # ... 24 more realistic entries
        ]
        
        for doc_data in demo_docs:
            doc = Document(**doc_data)
            self.db.add(doc)
            
    async def seed_invoices(self):
        """Create invoice-specific demo data."""
        # Paid invoices (60%)
        # Unpaid invoices (25%) 
        # Overdue invoices (15%)
        pass
        
    async def seed_address_book(self):
        """Create demo companies and contacts."""
        demo_companies = [
            "Acme Software Solutions",
            "Global Tech Industries", 
            "Metro Utilities Corp",
            "Premium Insurance Group",
            "Swift Logistics Ltd",
            # ... more
        ]
```

### 3.4 Query Filtering

#### Repository Updates
```python
# In src/backend/app/repository.py
class DocumentRepository:
    async def get_all(self, db: AsyncSession, current_user: User = None, **filters):
        query = select(Document)
        
        # Apply demo filter
        if current_user and current_user.role == "demo":
            query = query.where(Document.entity_id == -1)
        elif current_user and current_user.role != "admin":
            # Regular users see their entity data only
            query = query.where(Document.entity_id != -1)
            
        # Apply other filters...
        return await db.execute(query)
```

#### API Endpoint Protection
```python
# In src/backend/app/main.py
@app.post("/api/documents/upload")
@demo_readonly
async def upload_document(
    file: UploadFile,
    current_user: User = Depends(get_current_user)
):
    """Upload endpoint blocked for demo users."""
    pass

@app.get("/api/documents")
async def get_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Documents filtered by user role."""
    return await document_repository.get_all(db, current_user)
```

---

## 4. Frontend Implementation

### 4.1 Demo Mode Detection

#### Auth Context Update
```typescript
// In src/frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isDemo: boolean;  // New property
  // ... existing
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const isDemo = user?.role === 'demo';
  
  return (
    <AuthContext.Provider value={{ user, isDemo, /* ... */ }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 4.2 Demo Banner Component

#### Visual Indicator
```typescript
// New file: src/frontend/src/components/DemoBanner.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const DemoBanner: React.FC = () => {
  const { isDemo } = useAuth();
  
  if (!isDemo) return null;
  
  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
        <div>
          <p className="text-sm text-orange-700">
            <strong>Demo Mode:</strong> You're viewing sample data. 
            File uploads and settings changes are disabled.
          </p>
        </div>
      </div>
    </div>
  );
};
```

### 4.3 Feature Restrictions

#### Upload Blocking
```typescript
// In src/frontend/src/components/FileUpload.tsx
import { useAuth } from '../contexts/AuthContext';

export const FileUpload: React.FC = () => {
  const { isDemo } = useAuth();
  
  if (isDemo) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">File uploads disabled in demo mode</p>
        <p className="text-sm text-gray-400 mt-2">
          Sign up for a real account to upload documents
        </p>
      </div>
    );
  }
  
  // ... regular upload component
};
```

#### Settings Restrictions
```typescript
// In src/frontend/src/pages/SettingsPage.tsx
export const SettingsPage: React.FC = () => {
  const { isDemo } = useAuth();
  
  return (
    <div className="p-6">
      <DemoBanner />
      
      {isDemo ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Settings (Read-Only)</h2>
          <p className="text-gray-600">
            Settings are read-only in demo mode. Create an account to customize your experience.
          </p>
        </div>
      ) : (
        // ... regular settings
      )}
    </div>
  );
};
```

### 4.4 Login Page Updates

#### Demo Login Button
```typescript
// In src/frontend/src/pages/LoginPage.tsx
export const LoginPage: React.FC = () => {
  const handleDemoLogin = async () => {
    await login('demo', 'demo');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* ... existing login form */}
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          
          <button
            onClick={handleDemoLogin}
            className="mt-3 w-full flex justify-center py-2 px-4 border border-orange-300 rounded-md shadow-sm bg-orange-50 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            Try Demo (no signup required)
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 5. Demo Data Specifications

### 5.1 Document Types & Quantities
- **Invoices**: 15 documents (9 paid, 4 unpaid, 2 overdue)
- **Receipts**: 8 documents (all paid)
- **Contracts**: 3 documents (2 active, 1 expired)
- **Insurance**: 2 documents (active policies)
- **Utilities**: 6 documents (mix of paid/unpaid)

### 5.2 Realistic Company Names
```
- Acme Software Solutions
- Global Tech Industries  
- Metro Utilities Corporation
- Premium Insurance Group
- Swift Logistics Ltd
- Digital Marketing Pro
- CloudFirst Technologies
- Sustainable Energy Co
- Professional Services Inc
- Modern Office Supplies
```

### 5.3 Amount Ranges
- **Small invoices**: $50 - $500 (utilities, supplies)
- **Medium invoices**: $500 - $5,000 (services, software)
- **Large invoices**: $5,000 - $25,000 (contracts, equipment)

### 5.4 Date Distribution
- **Paid invoices**: 1-6 months ago
- **Unpaid invoices**: Due in 1-30 days
- **Overdue invoices**: 1-14 days past due

---

## 6. Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 2 hours | Backend auth updates, demo user seeding |
| **Phase 2** | 1.5 hours | Demo data seeder service, realistic fake data |
| **Phase 3** | 1 hour | Frontend demo banner, upload restrictions |
| **Phase 4** | 0.5 hours | Login page demo button, testing |

**Total estimated time**: 5 hours

---

## 7. Testing Checklist

### 7.1 Authentication
- [ ] Demo user can log in with `demo/demo`
- [ ] Demo user gets `role: "demo"` in JWT token
- [ ] Demo user cannot access admin endpoints
- [ ] Demo user cannot upload files

### 7.2 Data Isolation
- [ ] Demo user sees only demo documents (entity_id = -1)
- [ ] Regular users don't see demo data
- [ ] Admin users can see all data including demo

### 7.3 UI Restrictions
- [ ] Demo banner appears for demo users
- [ ] Upload areas show "disabled" message
- [ ] Settings page is read-only
- [ ] Demo login button works on login page

### 7.4 Data Quality
- [ ] Demo invoices have realistic amounts/dates
- [ ] Dashboard charts show meaningful data
- [ ] Address book has diverse company types
- [ ] Notifications include due date reminders

---

## 8. Future Enhancements

### 8.1 Demo Reset
- Periodic cleanup of demo data (weekly)
- Fresh demo data generation
- Demo session time limits

### 8.2 Demo Scenarios
- **Accountant demo**: Heavy invoice focus
- **Small business demo**: Mixed document types
- **Enterprise demo**: Large volumes, complex workflows

### 8.3 Demo Analytics
- Track demo user engagement
- Popular features in demo mode
- Conversion from demo to signup

---

## 9. Security Considerations

- Demo data must never contain real information
- Demo users cannot access file system
- Demo users cannot modify system settings
- Demo sessions should have shorter JWT expiry
- Rate limiting on demo login attempts

---

**Implementation Owner**: Backend + Frontend teams  
**Priority**: P2 (Nice to have)  
**Dependencies**: None (uses existing auth system) 