"""
Setup script for n8n chat integration database schema.

This script creates the necessary tables in Supabase for:
- Conversations
- Messages
- Workflows
- Workflow executions

Usage:
    python setup_n8n_database.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client with service role key for admin operations."""
    supabase_url = os.getenv("SUPABASE_URL")
    # Use service role key for schema operations
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "Missing Supabase credentials. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
    
    return create_client(supabase_url, supabase_key)


def read_schema_file() -> str:
    """Read the SQL schema file."""
    schema_file = Path(__file__).parent / "database_n8n_schema.sql"
    
    if not schema_file.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_file}")
    
    return schema_file.read_text(encoding='utf-8')


def execute_schema(client: Client, schema_sql: str):
    """Execute the schema SQL."""
    print("Executing schema SQL...")
    print("=" * 60)
    
    try:
        # Execute the SQL
        # Note: Supabase Python client uses PostgREST, which doesn't directly support DDL
        # We need to use the raw SQL execution via RPC or use Supabase CLI
        
        print("\nNote: This script shows the SQL to execute.")
        print("You have two options to create the schema:\n")
        
        print("Option 1: Use Supabase Dashboard")
        print("-" * 60)
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to the SQL Editor")
        print("3. Copy and paste the SQL from database_n8n_schema.sql")
        print("4. Click 'Run'\n")
        
        print("Option 2: Use Supabase CLI")
        print("-" * 60)
        print("1. Install Supabase CLI: npm install -g supabase")
        print("2. Link your project: supabase link --project-ref <your-project-ref>")
        print("3. Run: supabase db push\n")
        
        print("Option 3: Use psql directly")
        print("-" * 60)
        print("1. Get your database connection string from Supabase")
        print("2. Run: psql <connection-string> -f database_n8n_schema.sql\n")
        
        print("\nSchema SQL Preview:")
        print("=" * 60)
        print(schema_sql[:500] + "...\n")
        
        print("\nFull schema is in: database_n8n_schema.sql")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)


def verify_tables(client: Client) -> bool:
    """Verify that the tables were created."""
    print("\nVerifying table creation...")
    
    tables_to_check = [
        "conversations",
        "messages", 
        "workflows",
        "workflow_executions"
    ]
    
    try:
        for table_name in tables_to_check:
            try:
                # Try to query the table (will fail if doesn't exist)
                result = client.table(table_name).select("id").limit(1).execute()
                print(f"✓ Table '{table_name}' exists")
            except Exception as e:
                print(f"✗ Table '{table_name}' not found: {str(e)}")
                return False
        
        print("\n✓ All tables verified successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Verification failed: {str(e)}")
        return False


def main():
    """Main setup function."""
    print("=" * 60)
    print("n8n Chat Integration - Database Setup")
    print("=" * 60)
    print()
    
    try:
        # Get Supabase client
        print("Connecting to Supabase...")
        client = get_supabase_client()
        print("✓ Connected to Supabase\n")
        
        # Read schema file
        print("Reading schema file...")
        schema_sql = read_schema_file()
        print(f"✓ Schema file loaded ({len(schema_sql)} characters)\n")
        
        # Display instructions for executing schema
        execute_schema(client, schema_sql)
        
        # Prompt user
        print("\nHave you executed the SQL schema? (y/n): ", end="")
        response = input().strip().lower()
        
        if response == 'y':
            # Verify tables
            if verify_tables(client):
                print("\n" + "=" * 60)
                print("Setup completed successfully!")
                print("=" * 60)
                print("\nNext steps:")
                print("1. Configure your .env file with:")
                print("   - ANTHROPIC_API_KEY")
                print("   - N8N_MCP_URL")
                print("   - N8N_API_URL")
                print("   - N8N_API_KEY")
                print("2. Start n8n-mcp server: npm start (in n8n-mcp directory)")
                print("3. Start FastAPI backend: uvicorn app.main:app --reload")
                print("4. Test the /health endpoint to verify all services")
                print("=" * 60)
            else:
                print("\n" + "=" * 60)
                print("Setup incomplete - some tables are missing")
                print("Please ensure the SQL was executed successfully")
                print("=" * 60)
                sys.exit(1)
        else:
            print("\nPlease execute the SQL schema and run this script again.")
            print("=" * 60)
            sys.exit(0)
        
    except Exception as e:
        print(f"\n✗ Setup failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()

