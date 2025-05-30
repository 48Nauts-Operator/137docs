#!/usr/bin/env python3
"""
Script to manually force processing of Hetzner invoices.
This bypasses the duplicate detection and adds them directly to the processing queue.
"""
import asyncio
import sys
import os
import glob

# Add the backend path to sys.path so we can import the modules
sys.path.insert(0, '/app')

from app.main import process_new_document

async def force_process_hetzner_invoices():
    """Force processing of all Hetzner invoices in the inbox."""
    
    # Path to the inbox folder inside the container
    inbox_path = "/hostfs/Inbox"
    
    # Find all Hetzner invoice files
    hetzner_files = glob.glob(os.path.join(inbox_path, "*Hetzner*.pdf"))
    
    print(f"Found {len(hetzner_files)} Hetzner invoice files:")
    for file_path in hetzner_files:
        print(f"  - {os.path.basename(file_path)}")
    
    if not hetzner_files:
        print("No Hetzner invoice files found in the inbox.")
        return
    
    print("\nStarting manual processing of Hetzner invoices...")
    
    for i, file_path in enumerate(hetzner_files, 1):
        print(f"\nProcessing {i}/{len(hetzner_files)}: {os.path.basename(file_path)}")
        try:
            # Call the processing function directly
            await process_new_document(file_path)
            print(f"✅ Successfully processed: {os.path.basename(file_path)}")
        except Exception as e:
            print(f"❌ Error processing {os.path.basename(file_path)}: {str(e)}")
    
    print(f"\nCompleted processing {len(hetzner_files)} Hetzner invoices.")

if __name__ == "__main__":
    asyncio.run(force_process_hetzner_invoices()) 