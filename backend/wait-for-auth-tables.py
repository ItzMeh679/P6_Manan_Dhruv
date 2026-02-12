#!/usr/bin/env python3
"""
Wait for auth tables to be created by Better Auth before running migrations.
This ensures Alembic migrations that reference auth tables don't fail.
"""
import os
import sys
import time
import asyncpg


async def wait_for_user_table():
    """Wait for the 'user' table to exist in the database."""
    database_url = os.getenv("DATABASE_URL", "")
    # Convert to asyncpg format
    database_url = database_url.replace("postgres://", "postgresql://")
    
    max_attempts = 60  # Wait up to 2 minutes
    attempt = 0
    
    print("Waiting for auth tables to be created by Better Auth...", flush=True)
    
    while attempt < max_attempts:
        try:
            conn = await asyncpg.connect(database_url)
            # Check if user table exists
            result = await conn.fetchval(
                "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user')"
            )
            await conn.close()
            
            if result:
                print("✓ Auth tables detected! Proceeding with backend migrations...", flush=True)
                return True
            else:
                print(f"Auth tables not ready yet (attempt {attempt + 1}/{max_attempts})...", flush=True)
                await asyncio.sleep(2)
                attempt += 1
        except Exception as e:
            print(f"Connection attempt {attempt + 1}/{max_attempts} failed: {e}", flush=True)
            await asyncio.sleep(2)
            attempt += 1
    
    print("ERROR: Timeout waiting for auth tables", file=sys.stderr, flush=True)
    return False


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(wait_for_user_table())
    sys.exit(0 if success else 1)
