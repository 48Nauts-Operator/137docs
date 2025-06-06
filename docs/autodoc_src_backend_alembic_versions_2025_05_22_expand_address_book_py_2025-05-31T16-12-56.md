<!--
This documentation was auto-generated by Claude on 2025-05-31T16-12-56.
Source file: ./src/backend/alembic/versions/2025_05_22_expand_address_book.py
-->

# Database Migration: Expand Address Book Columns

## Overview

This Alembic migration script expands the `address_book` table with additional columns to support comprehensive address and contact information management.

## Migration Details

| Property | Value |
|----------|-------|
| **Revision ID** | `2025_05_22_expand_address_book` |
| **Parent Revision** | `2025_05_21_add_users_table` |
| **Created** | 2025-05-22 00:00:00.000000 |
| **Migration Type** | Schema Enhancement |

## Changes Applied

### Upgrade Operations

The migration adds seven new columns to the existing `address_book` table:

| Column Name | Data Type | Length | Nullable | Description |
|-------------|-----------|---------|----------|-------------|
| `street` | String | 255 | Yes | Primary street address |
| `address2` | String | 255 | Yes | Secondary address line (apt, suite, etc.) |
| `town` | String | 255 | Yes | City or town name |
| `zip` | String | 20 | Yes | Postal/ZIP code |
| `county` | String | 100 | Yes | County or administrative region |
| `group_name` | String | 100 | Yes | Contact group classification |
| `last_transaction` | String | 50 | Yes | Most recent transaction reference |

### Downgrade Operations

The migration can be reversed by dropping all added columns in reverse order to maintain referential integrity.

## Usage

### Applying the Migration

```bash
# Upgrade to this revision
alembic upgrade 2025_05_22_expand_address_book

# Or upgrade to latest
alembic upgrade head
```

### Rolling Back the Migration

```bash
# Downgrade to previous revision
alembic downgrade 2025_05_21_add_users_table
```

## Implementation Notes

- **Batch Operations**: Uses `op.batch_alter_table()` for compatibility with SQLite and other databases that require table recreation for schema changes
- **Nullable Columns**: All new columns are nullable to accommodate existing records without requiring default values
- **Column Ordering**: Downgrade operations drop columns in reverse order of creation
- **Data Preservation**: Existing data in the `address_book` table remains intact

## Dependencies

- **Alembic**: Database migration framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Previous Migration**: Requires `2025_05_21_add_users_table` to be applied first

## Schema Impact

This migration enhances the address book functionality by providing fields for:
- Complete postal addresses
- Contact categorization via groups
- Transaction history tracking

The expanded schema supports more comprehensive contact management while maintaining backward compatibility through nullable column constraints.