#!/usr/bin/env python3
"""
Test runner for 137Docs LLM integration tests.
"""
import sys
import subprocess
import os

def run_tests():
    """Run the LLM integration tests."""
    print("🧪 Running 137Docs LLM Integration Tests")
    print("=" * 50)
    
    # Set environment variables for testing
    os.environ['TESTING'] = 'true'
    os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///:memory:'
    
    # Run pytest with specific test file
    cmd = [
        sys.executable, '-m', 'pytest',
        'tests/test_llm_simple.py',
        '-v',
        '--tb=short',
        '--asyncio-mode=auto',
        '-s'  # Show print output
    ]
    
    try:
        result = subprocess.run(cmd, check=True)
        print("\n✅ All LLM integration tests passed!")
        return 0
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Tests failed with exit code {e.returncode}")
        return e.returncode
    except FileNotFoundError:
        print("❌ pytest not found. Please install test dependencies:")
        print("pip install pytest pytest-asyncio pytest-mock")
        return 1

if __name__ == '__main__':
    sys.exit(run_tests()) 