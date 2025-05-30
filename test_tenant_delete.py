#!/usr/bin/env python3
"""
Test script to verify tenant delete functionality
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src/backend'))

from app.database import get_db
from app.models import Entity, UserEntity, User
from app.repository import TenantRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def test_tenant_operations():
    """Test tenant CRUD operations"""
    print("Testing tenant operations...")
    
    async for db in get_db():
        try:
            # Check existing entities
            result = await db.execute(select(Entity).where(Entity.is_active == True))
            entities = result.scalars().all()
            print(f"Found {len(entities)} active entities:")
            for e in entities:
                print(f"  ID: {e.id}, Name: {e.name}, Alias: {e.alias}")
            
            # Check users
            user_result = await db.execute(select(User))
            users = user_result.scalars().all()
            print(f"Found {len(users)} users:")
            for u in users:
                print(f"  ID: {u.id}, Username: {u.username}")
            
            if users and entities:
                # Test delete functionality
                tenant_repo = TenantRepository()
                user_id = users[0].id
                tenant_id = entities[0].id
                
                print(f"Testing delete for tenant {tenant_id} by user {user_id}")
                success = await tenant_repo.delete_tenant(db, user_id, tenant_id)
                print(f"Delete result: {success}")
                
                if success:
                    await db.commit()
                    print("Delete committed successfully")
                else:
                    print("Delete failed - tenant not found or access denied")
            else:
                print("No users or entities found for testing")
                
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(test_tenant_operations()) 