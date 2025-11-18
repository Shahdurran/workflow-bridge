#!/usr/bin/env python3
"""
Test script to verify the database was created correctly
"""

import sqlite3
import json
from pathlib import Path

def test_database():
    script_dir = Path(__file__).parent.parent
    db_path = script_dir / 'database' / 'make.db'
    
    if not db_path.exists():
        print("❌ Database not found!")
        return False
        
    print(f"✅ Database found at: {db_path}\n")
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Test 1: Check tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"📊 Tables: {', '.join(tables)}\n")
    
    # Test 2: Count modules
    cursor.execute("SELECT COUNT(*) FROM make_modules")
    module_count = cursor.fetchone()[0]
    print(f"📦 Total modules: {module_count}")
    
    # Test 3: List all modules
    cursor.execute("""
        SELECT module_name, app_name, module_type, description
        FROM make_modules
        ORDER BY module_name
    """)
    print("\n📋 Modules:")
    for row in cursor.fetchall():
        print(f"  • {row[0]} ({row[1]}) - {row[2]}")
        print(f"    {row[3]}")
    
    # Test 4: Count parameters
    cursor.execute("SELECT COUNT(*) FROM make_parameters")
    param_count = cursor.fetchone()[0]
    print(f"\n⚙️  Total parameters: {param_count}")
    
    # Test 5: Sample module with parameters
    cursor.execute("""
        SELECT m.module_name, m.description,
               p.parameter_name, p.parameter_type, p.is_required, p.description
        FROM make_modules m
        LEFT JOIN make_parameters p ON m.id = p.module_id
        WHERE m.module_name = 'http:ActionSendData'
    """)
    
    print("\n🔍 Sample Module: http:ActionSendData")
    rows = cursor.fetchall()
    if rows:
        print(f"   Description: {rows[0][1]}")
        print("   Parameters:")
        for row in rows:
            if row[2]:
                required = "required" if row[4] else "optional"
                print(f"     - {row[2]} ({row[3]}, {required}): {row[5]}")
    
    # Test 6: FTS5 search
    print("\n🔎 Testing FTS5 search for 'http request':")
    cursor.execute("""
        SELECT module_name, app_name, description
        FROM make_modules_fts
        WHERE make_modules_fts MATCH 'http request'
        LIMIT 3
    """)
    for row in cursor.fetchall():
        print(f"   • {row[0]} ({row[1]})")
        print(f"     {row[2]}")
    
    # Test 7: Check apps
    cursor.execute("SELECT DISTINCT app_name FROM make_modules ORDER BY app_name")
    apps = [row[0] for row in cursor.fetchall()]
    print(f"\n📱 Apps: {', '.join(apps)}")
    
    # Test 8: Check categories
    cursor.execute("SELECT DISTINCT category FROM make_modules ORDER BY category")
    categories = [row[0] for row in cursor.fetchall()]
    print(f"🏷️  Categories: {', '.join(categories)}")
    
    conn.close()
    
    print("\n✅ Database validation complete!")
    return True

if __name__ == '__main__':
    test_database()

