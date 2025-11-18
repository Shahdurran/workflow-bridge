#!/usr/bin/env python3
"""
Python-based Module Importer
No compilation required - works on any platform!
"""

import json
import sqlite3
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import uuid

class ModuleImporter:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self.stats = {
            'total': 0,
            'imported': 0,
            'updated': 0,
            'failed': 0,
            'errors': []
        }
        
    def connect(self):
        """Connect to database and create tables if needed"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.create_tables()
        
    def create_tables(self):
        """Create database schema"""
        cursor = self.conn.cursor()
        
        # Create modules table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS make_modules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module_name TEXT UNIQUE NOT NULL,
                module_type TEXT NOT NULL,
                app_name TEXT NOT NULL,
                app_slug TEXT NOT NULL,
                description TEXT,
                documentation TEXT,
                category TEXT,
                popularity_score INTEGER DEFAULT 50,
                is_premium INTEGER DEFAULT 0,
                icon_url TEXT,
                documentation_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create parameters table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS make_parameters (
                id TEXT PRIMARY KEY,
                module_id INTEGER NOT NULL,
                parameter_name TEXT NOT NULL,
                parameter_type TEXT NOT NULL,
                is_required INTEGER DEFAULT 0,
                description TEXT,
                default_value TEXT,
                options TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES make_modules(id) ON DELETE CASCADE
            )
        ''')
        
        # Create FTS5 search index
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS make_modules_fts USING fts5(
                module_name,
                app_name,
                description,
                documentation,
                category,
                content='make_modules',
                content_rowid='id'
            )
        ''')
        
        # Create triggers for FTS sync
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS make_modules_ai AFTER INSERT ON make_modules BEGIN
                INSERT INTO make_modules_fts(rowid, module_name, app_name, description, documentation, category)
                VALUES (new.id, new.module_name, new.app_name, new.description, new.documentation, new.category);
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS make_modules_ad AFTER DELETE ON make_modules BEGIN
                INSERT INTO make_modules_fts(make_modules_fts, rowid, module_name, app_name, description, documentation, category)
                VALUES('delete', old.id, old.module_name, old.app_name, old.description, old.documentation, old.category);
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS make_modules_au AFTER UPDATE ON make_modules BEGIN
                INSERT INTO make_modules_fts(make_modules_fts, rowid, module_name, app_name, description, documentation, category)
                VALUES('delete', old.id, old.module_name, old.app_name, old.description, old.documentation, old.category);
                INSERT INTO make_modules_fts(rowid, module_name, app_name, description, documentation, category)
                VALUES (new.id, new.module_name, new.app_name, new.description, new.documentation, new.category);
            END
        ''')
        
        self.conn.commit()
        
    def slugify(self, text: str) -> str:
        """Convert text to slug"""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'\s+', '-', text)
        text = re.sub(r'-+', '-', text)
        return text.strip('-')
        
    def calculate_popularity(self, module: Dict) -> int:
        """Calculate module popularity score"""
        score = 50
        
        # Core modules
        if module['app'] in ['HTTP', 'Webhooks', 'Tools']:
            score += 30
            
        # Popular apps
        popular_apps = ['Google Sheets', 'Gmail', 'Slack', 'Airtable', 'Notion']
        if module['app'] in popular_apps:
            score += 20
            
        # Triggers are important
        if module['type'] == 'trigger':
            score += 10
            
        return min(100, score)
        
    def generate_documentation(self, module: Dict) -> str:
        """Generate module documentation"""
        doc = f"# {module['name']}\n\n"
        doc += f"{module['description']}\n\n"
        doc += f"## App\n{module['app']}\n\n"
        doc += f"## Type\n{module['type']}\n\n"
        doc += "## Parameters\n"
        
        for param in module['parameters']:
            required = "(required)" if param['required'] else "(optional)"
            doc += f"- **{param['name']}** {required}: {param.get('description', 'No description')}"
            if 'options' in param:
                doc += f" Options: {', '.join(param['options'])}"
            doc += "\n"
            
        doc += f"\n## Category\n{module['category']}\n"
        return doc
        
    def import_module(self, module: Dict):
        """Import a single module"""
        cursor = self.conn.cursor()
        
        # Check if module exists
        cursor.execute('SELECT id FROM make_modules WHERE module_name = ?', (module['id'],))
        existing = cursor.fetchone()
        is_update = existing is not None
        
        # Insert or update module
        cursor.execute('''
            INSERT INTO make_modules (
                module_name, module_type, app_name, app_slug,
                description, documentation, category, popularity_score,
                is_premium, icon_url, documentation_url, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(module_name) DO UPDATE SET
                module_type = excluded.module_type,
                app_name = excluded.app_name,
                app_slug = excluded.app_slug,
                description = excluded.description,
                documentation = excluded.documentation,
                category = excluded.category,
                popularity_score = excluded.popularity_score,
                is_premium = excluded.is_premium,
                icon_url = excluded.icon_url,
                documentation_url = excluded.documentation_url,
                updated_at = CURRENT_TIMESTAMP
        ''', (
            module['id'],
            module['type'],
            module['app'],
            self.slugify(module['app']),
            module['description'],
            self.generate_documentation(module),
            module['category'],
            self.calculate_popularity(module),
            1 if module.get('is_premium', False) else 0,
            module.get('icon_url'),
            module.get('documentation_url')
        ))
        
        module_id = cursor.lastrowid if not is_update else existing[0]
        
        if is_update:
            self.stats['updated'] += 1
            print(f"  ℹ️  Updated existing module")
            # Delete old parameters
            cursor.execute('DELETE FROM make_parameters WHERE module_id = ?', (module_id,))
        
        # Insert parameters
        for param in module['parameters']:
            param_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO make_parameters (
                    id, module_id, parameter_name, parameter_type,
                    is_required, description, default_value, options
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                param_id,
                module_id,
                param['name'],
                param['type'],
                1 if param['required'] else 0,
                param.get('description', ''),
                json.dumps(param.get('default_value')) if 'default_value' in param else None,
                json.dumps(param.get('options')) if 'options' in param else None
            ))
        
        print(f"  📝 Imported {len(module['parameters'])} parameters")
        self.conn.commit()
        
    def import_from_file(self, file_path: str):
        """Import modules from JSON file"""
        print(f"\n🔄 Starting module import from: {file_path}\n")
        
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if 'modules' not in data or not isinstance(data['modules'], list):
            raise ValueError('Invalid format: expected { modules: [...] }')
            
        self.stats['total'] = len(data['modules'])
        print(f"📊 Found {self.stats['total']} modules to import\n")
        
        # Import each module
        for i, module in enumerate(data['modules'], 1):
            print(f"[{i}/{self.stats['total']}] Processing: {module['name']} ({module['id']})")
            
            try:
                self.import_module(module)
                self.stats['imported'] += 1
                print(f"  ✅ Imported successfully\n")
            except Exception as e:
                self.stats['failed'] += 1
                error_msg = f"Failed to import {module['id']}: {e}"
                self.stats['errors'].append(error_msg)
                print(f"  ❌ {error_msg}\n")
                
        self.print_summary()
        
    def print_summary(self):
        """Print import summary"""
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print("=" * 60)
        print(f"Total modules:     {self.stats['total']}")
        print(f"✅ Imported:       {self.stats['imported']}")
        print(f"🔄 Updated:        {self.stats['updated']}")
        print(f"❌ Failed:         {self.stats['failed']}")
        print("=" * 60)
        
        if self.stats['errors']:
            print("\n❌ ERRORS:")
            for error in self.stats['errors']:
                print(f"  - {error}")
                
        print("\n✨ Import complete!\n")
        
        # Database stats
        cursor = self.conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM make_modules')
        total_modules = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(DISTINCT app_name) FROM make_modules')
        total_apps = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM make_parameters')
        total_params = cursor.fetchone()[0]
        
        print("📈 DATABASE STATISTICS:")
        print(f"  Total modules:   {total_modules}")
        print(f"  Total apps:      {total_apps}")
        print(f"  Total params:    {total_params}")
        print()
        
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

def main():
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        # Default path
        script_dir = Path(__file__).parent.parent
        input_file = script_dir / 'data' / 'modules-input.json'
        
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        print("\nUsage: python import_modules.py [path/to/modules.json]")
        sys.exit(1)
        
    # Database path
    script_dir = Path(__file__).parent.parent
    db_path = script_dir / 'database' / 'make.db'
    
    importer = ModuleImporter(str(db_path))
    
    try:
        importer.connect()
        importer.import_from_file(str(input_file))
        importer.close()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        importer.close()
        sys.exit(1)

if __name__ == '__main__':
    main()

