<!-- Auto-generated by Claude on 2025-06-01 10:12 -->

# Database Migration: Add User Columns

## Overview

This is an Alembic database migration file that adds missing columns to the `users` table. It's designed to patch installations where the users table was created before version 0.08 and lacks the required `full_name` and `role` columns needed by the authentication system.

## Purpose

- **Backward Compatibility**: Ensures older database installations are compatible with new authentication requirements
- **Schema Patching**: Adds essential user metadata columns that were introduced in v0.08
- **Safe Migration**: Uses defensive programming to handle cases where columns might already exist

## Migration Details

### Revision Information
- **Revision ID**: `20250523_user_cols`
- **Previous Revision**: `2025_05_22_add_settings_table`
- **Created**: 2025-05-23

### Target Changes
The migration adds two new columns to the `users` table:

1. **`full_name`**: `VARCHAR(100)` - Stores the user's complete name
2. **`role`**: `VARCHAR(20) NOT NULL DEFAULT 'viewer'` - Defines user permissions level

## Functions

### `upgrade()`

Executes the forward migration by adding the required columns.

```python
def upgrade():
    connection = op.get_bind()
    
    try:
        op.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(100);")
    except Exception:
        pass
    
    try:
        op.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'viewer';")
    except Exception:
        pass
```

**Key Features:**
- Uses try/catch blocks to handle existing columns gracefully
- Adds columns with appropriate data types and constraints
- Sets default role as 'viewer' for security

### `downgrade()`

Handles rollback of the migration.

```python
def downgrade():
    # SQLite doesn't support DROP COLUMN, so we can't easily remove these columns
    # In practice, this would require recreating the table
    pass 
```

**Important Note:** The downgrade function is intentionally empty due to SQLite limitations.

## Technical Considerations

### SQLite Limitations

- **No IF NOT EXISTS**: SQLite doesn't support `IF NOT EXISTS` with `ADD COLUMN`
- **No DROP COLUMN**: SQLite doesn't support dropping columns directly
- **Defensive Approach**: Exception handling compensates for these limitations

### Error Handling Strategy

The migration uses broad exception catching because:
- SQLite error messages can vary between versions
- Primary concern is column existence, not specific error types
- Graceful handling prevents migration failures on partial upgrades

## Usage Notes

### When This Migration Runs
- Automatically executed during database upgrades
- Particularly relevant for installations predating v0.08
- Safe to run multiple times (idempotent)

### Post-Migration Behavior
- New user records will have both columns populated
- Existing users will have:
  - `full_name`: NULL (can be updated later)
  - `role`: 'viewer' (default value applied)

## Recommendations

### For Developers
- **Test thoroughly** on SQLite databases of different versions
- **Consider data population** scripts for existing users after migration
- **Document role types** that the application expects

### For Database Administrators
- **Backup database** before running migrations
- **Verify column addition** after migration completes
- **Update existing user records** with appropriate full names and roles

## Related Files
- Previous migration: `2025_05_22_add_settings_table`
- Authentication logic that requires these columns (likely in v0.08+)