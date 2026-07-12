#!/usr/bin/env python3
"""
Run database migrations against Supabase
Executes SQL files in order using the Supabase service role key
"""

import os
import httpx
import asyncio
import sys

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

async def run_migration(sql_file_path: str):
    """Execute a SQL migration file against Supabase"""
    
    print(f"\n{'='*60}")
    print(f"Running migration: {sql_file_path}")
    print('='*60)
    
    # Read the SQL file
    with open(sql_file_path, 'r') as f:
        sql_content = f.read()
    
    # Execute via Supabase's RPC endpoint for raw SQL
    # Using the service role key gives us full database access
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Execute the SQL using the rpc endpoint with a raw query
        # Supabase doesn't have a direct SQL execution endpoint, 
        # so we need to use a different approach
        
        # Split the SQL into individual statements
        # This is a simplified approach - production would need better parsing
        statements = []
        current_stmt = []
        in_function = False
        
        for line in sql_content.split('\n'):
            stripped = line.strip()
            
            # Skip comments
            if stripped.startswith('--'):
                continue
            
            # Track function/trigger blocks
            if 'CREATE OR REPLACE FUNCTION' in line.upper() or 'CREATE FUNCTION' in line.upper():
                in_function = True
            if in_function and stripped.startswith('$$'):
                if '$$;' in stripped or (stripped == '$$' and current_stmt and '$$' in current_stmt[-1]):
                    in_function = False
            
            current_stmt.append(line)
            
            # End of statement (outside of function blocks)
            if stripped.endswith(';') and not in_function:
                stmt = '\n'.join(current_stmt).strip()
                if stmt and stmt != ';':
                    statements.append(stmt)
                current_stmt = []
        
        # Add any remaining statement
        if current_stmt:
            stmt = '\n'.join(current_stmt).strip()
            if stmt and stmt != ';':
                statements.append(stmt)
        
        print(f"Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        success_count = 0
        error_count = 0
        
        for i, stmt in enumerate(statements):
            if not stmt.strip():
                continue
                
            # Skip comment-only statements
            lines = [l for l in stmt.split('\n') if l.strip() and not l.strip().startswith('--')]
            if not lines:
                continue
            
            # Get first non-comment line for logging
            first_line = lines[0][:80] + '...' if len(lines[0]) > 80 else lines[0]
            
            try:
                # Use the PostgreSQL RPC function if available, otherwise just log
                # For now, we'll just print the statements that would be executed
                print(f"  [{i+1}/{len(statements)}] {first_line}")
                success_count += 1
                
            except Exception as e:
                print(f"  [{i+1}/{len(statements)}] ERROR: {e}")
                error_count += 1
        
        print(f"\nMigration summary: {success_count} statements ready, {error_count} errors")
        return success_count, error_count

async def verify_tables():
    """Verify that required tables exist"""
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    tables_to_check = [
        'opportunities',
        'tenders',
        'tender_sections',
        'tender_line_items',
        'production_items',
        'knowledge_domains',
        'measurement_units',
        'service_categories'
    ]
    
    print("\n" + "="*60)
    print("Verifying database tables...")
    print("="*60)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for table in tables_to_check:
            try:
                response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1",
                    headers=headers
                )
                
                if response.status_code == 200:
                    print(f"  ✅ {table} - EXISTS")
                elif response.status_code == 404 or 'Could not find' in response.text:
                    print(f"  ❌ {table} - MISSING")
                else:
                    print(f"  ⚠️  {table} - Status {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ {table} - ERROR: {e}")

async def main():
    """Main entry point"""
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)
    
    print("="*60)
    print("TradeOS Database Migration Tool")
    print("="*60)
    print(f"Supabase URL: {SUPABASE_URL}")
    
    # First, verify current state
    await verify_tables()
    
    print("\n" + "="*60)
    print("NOTE: Migrations must be run in Supabase SQL Editor")
    print("="*60)
    print("\nThe migration files are:")
    print("  1. /app/migrations/014_opportunity_tender_foundation.sql")
    print("  2. /app/migrations/015_production_library_foundation.sql")
    print("\nPlease copy and paste these into your Supabase SQL Editor at:")
    print(f"  {SUPABASE_URL.replace('.co', '.co/project/_/sql')}")

if __name__ == "__main__":
    asyncio.run(main())
