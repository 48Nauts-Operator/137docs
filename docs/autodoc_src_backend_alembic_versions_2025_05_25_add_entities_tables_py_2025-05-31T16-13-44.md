<!--
This documentation was auto-generated by Claude on 2025-05-31T16-13-44.
Source file: ./src/backend/alembic/versions/2025_05_25_add_entities_tables.py
-->

# Database Migration: Add Entities Tables and Columns

## Overview

This Alembic migration adds entity management functionality to the database schema. It introduces the concept of entities (companies/organizations) and establishes relationships between users, entities, and documents.

## Migration Details

- **Revision ID**: `20250525_entities`
- **Previous Revision**: `20250524_vectors`
- **Created**: 2025-05-25

## Schema Changes

### New Tables

#### `entities`
Primary table for storing entity information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Entity name |
| `type` | VARCHAR(20) | DEFAULT 'company' | Entity type classification |
| `address_json` | TEXT | NULLABLE | JSON-formatted address data |
| `vat_id` | VARCHAR(50) | NULLABLE | VAT identification number |
| `iban` | VARCHAR(50) | NULLABLE | International bank account number |
| `aliases` | TEXT[] | NULLABLE | Array of alternative names (PostgreSQL-specific) |
| `created_at` | DATETIME | DEFAULT NOW() | Record creation timestamp |

#### `user_entities`
Junction table establishing many-to-many relationships between users and entities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | INTEGER | PRIMARY KEY, FOREIGN KEY → `users.id` | Reference to user |
| `entity_id` | INTEGER | PRIMARY KEY, FOREIGN KEY → `entities.id` | Reference to entity |
| `role` | VARCHAR(20) | DEFAULT 'owner' | User's role within the entity |

### Modified Tables

#### `documents`
- **Added Column**: `entity_id` (INTEGER, NULLABLE)
  - Foreign key reference to `entities.id`
  - Indexed for query performance
  - Establishes relationship between documents and entities

#### `settings`
- **Added Column**: `tos_accepted_at` (DATETIME, NULLABLE)
  - Timestamp for terms of service acceptance
  - Used for compliance tracking

### Indexes and Constraints

- **Index**: `ix_documents_entity_id` on `documents.entity_id`
- **Foreign Key**: `documents.entity_id` → `entities.id`
- **Foreign Key**: `user_entities.user_id` → `users.id`
- **Foreign Key**: `user_entities.entity_id` → `entities.id`

## Database Requirements

- **PostgreSQL**: Required for `ARRAY` data type support
- **Alembic**: Database migration framework
- **SQLAlchemy**: ORM framework

## Usage

### Apply Migration
```bash
alembic upgrade 20250525_entities
```

### Rollback Migration
```bash
alembic downgrade 20250524_vectors
```

## Rollback Behavior

The downgrade function performs the following operations in reverse order:
1. Removes `tos_accepted_at` column from `settings`
2. Drops foreign key constraint on `documents.entity_id`
3. Removes index on `documents.entity_id`
4. Drops `entity_id` column from `documents`
5. Drops `user_entities` junction table
6. Drops `entities` table

## Notes

- The `aliases` column uses PostgreSQL's native array type
- Entity addresses are stored as JSON text for flexibility
- The migration maintains referential integrity through foreign key constraints
- All timestamp fields use server-side defaults for consistency