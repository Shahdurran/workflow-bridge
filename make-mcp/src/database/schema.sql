-- Make.com Modules Database Schema
-- Version: 1.0.0

-- Main modules table storing all Make.com modules/apps
CREATE TABLE IF NOT EXISTS make_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_name TEXT NOT NULL UNIQUE,
    module_type TEXT NOT NULL CHECK(module_type IN ('trigger', 'action', 'search', 'instant_trigger', 'aggregator', 'router', 'transformer', 'iterator', 'repeater')),
    app_name TEXT NOT NULL,
    app_slug TEXT NOT NULL,
    description TEXT,
    documentation TEXT,
    parameters TEXT, -- JSON array of parameter definitions
    examples TEXT, -- JSON array of example configurations
    category TEXT,
    popularity_score INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates table for storing Make scenario templates
CREATE TABLE IF NOT EXISTS make_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    modules TEXT, -- JSON array of modules used
    flow TEXT, -- JSON representation of the scenario flow
    metadata TEXT, -- JSON metadata (author, created date, etc.)
    category TEXT,
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parameters table for detailed parameter information
CREATE TABLE IF NOT EXISTS module_parameters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL,
    parameter_name TEXT NOT NULL,
    parameter_type TEXT NOT NULL, -- text, number, select, array, object, etc.
    is_required BOOLEAN DEFAULT 0,
    description TEXT,
    default_value TEXT,
    options TEXT, -- JSON array for select types
    validation_rules TEXT, -- JSON object with validation rules
    FOREIGN KEY (module_id) REFERENCES make_modules(id) ON DELETE CASCADE,
    UNIQUE(module_id, parameter_name)
);

-- Categories table for organizing modules
CREATE TABLE IF NOT EXISTS module_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    parent_category_id INTEGER,
    FOREIGN KEY (parent_category_id) REFERENCES module_categories(id)
);

-- Full-text search index for modules
CREATE VIRTUAL TABLE IF NOT EXISTS make_modules_fts USING fts5(
    module_name,
    app_name,
    description,
    documentation,
    content='make_modules',
    content_rowid='id'
);

-- Triggers to keep FTS index updated
CREATE TRIGGER IF NOT EXISTS make_modules_fts_insert AFTER INSERT ON make_modules BEGIN
    INSERT INTO make_modules_fts(rowid, module_name, app_name, description, documentation)
    VALUES (new.id, new.module_name, new.app_name, new.description, new.documentation);
END;

CREATE TRIGGER IF NOT EXISTS make_modules_fts_delete AFTER DELETE ON make_modules BEGIN
    DELETE FROM make_modules_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS make_modules_fts_update AFTER UPDATE ON make_modules BEGIN
    DELETE FROM make_modules_fts WHERE rowid = old.id;
    INSERT INTO make_modules_fts(rowid, module_name, app_name, description, documentation)
    VALUES (new.id, new.module_name, new.app_name, new.description, new.documentation);
END;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_modules_app_name ON make_modules(app_name);
CREATE INDEX IF NOT EXISTS idx_modules_type ON make_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_category ON make_modules(category);
CREATE INDEX IF NOT EXISTS idx_modules_popularity ON make_modules(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_templates_category ON make_templates(category);
CREATE INDEX IF NOT EXISTS idx_parameters_module ON module_parameters(module_id);

-- Insert default categories
INSERT OR IGNORE INTO module_categories (name, description) VALUES
    ('Communication', 'Email, messaging, and communication tools'),
    ('Productivity', 'Task management, notes, and productivity apps'),
    ('CRM', 'Customer relationship management systems'),
    ('E-commerce', 'Shopping carts, payment processors, and stores'),
    ('Social Media', 'Social networking platforms'),
    ('Developer Tools', 'APIs, version control, and development platforms'),
    ('Data & Storage', 'Databases, spreadsheets, and file storage'),
    ('Marketing', 'Marketing automation and analytics'),
    ('Finance', 'Accounting, invoicing, and financial tools'),
    ('HTTP & Webhooks', 'HTTP requests and webhook handlers');

