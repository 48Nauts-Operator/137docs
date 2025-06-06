<!--
This documentation was auto-generated by Claude on 2025-06-01T06-33-06.
Source file: ./src/backend/alembic/versions/2025_05_22_add_settings_table.py
-->

# Database Migration: Add Settings Table

## Overview

This Alembic migration adds a `settings` table to store application configuration data including file paths and system state information.

## Migration Details

- **Revision ID**: `2025_05_22_add_settings_table`
- **Parent Revision**: `2025_05_22_expand_address_book`
- **Creation Date**: 2025-05-22 00:00:00.000000

## Table Schema

### `settings`

The migration creates a new table with the following structure:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `inbox_path` | VARCHAR(255) | NOT NULL | File system path to the inbox directory |
| `storage_root` | VARCHAR(255) | NOT NULL | Root directory for file storage |
| `locked` | BOOLEAN | DEFAULT FALSE | System lock status flag |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | DEFAULT NOW() | Record last update timestamp |

## Functions

### `upgrade()`

Executes the forward migration by creating the `settings` table with all specified columns, constraints, and default values.

**SQL Operation:**
```sql
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    inbox_path VARCHAR(255) NOT NULL,
    storage_root VARCHAR(255) NOT NULL,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
```

### `downgrade()`

Executes the reverse migration by dropping the `settings` table.

**SQL Operation:**
```sql
DROP TABLE IF EXISTS settings;
```

## Usage

To apply this migration:
```bash
alembic upgrade head
```

To rollback this migration:
```bash
alembic downgrade 2025_05_22_expand_address_book
```

## Notes

- The migration uses `IF NOT EXISTS` and `IF EXISTS` clauses to prevent errors during repeated execution
- Timestamp columns automatically populate with the current time when records are created
- The `locked` field defaults to `FALSE`, indicating the system is unlocked by default
- Path fields are limited to 255 characters and cannot be null