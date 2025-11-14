"""
Platform-specific constants and templates for workflow generation.
"""

from typing import Dict, List, Any

# Supported platforms
PLATFORMS = ["n8n", "make", "zapier"]

# Platform capabilities and information
SUPPORTED_PLATFORMS = {
    "n8n": {
        "name": "n8n",
        "display_name": "n8n",
        "description": "Open source workflow automation tool with self-hosting option",
        "website": "https://n8n.io"
    },
    "make": {
        "name": "make",
        "display_name": "Make (Integromat)",
        "description": "Visual platform for designing, building and automating workflows",
        "website": "https://www.make.com"
    },
    "zapier": {
        "name": "zapier",
        "display_name": "Zapier",
        "description": "Easy automation for busy people, connects 5000+ apps",
        "website": "https://zapier.com"
    }
}

# Platform capabilities
PLATFORM_CAPABILITIES = {
    "n8n": {
        "max_nodes": 100,
        "supports_custom_code": True,
        "supports_webhooks": True,
        "supports_conditional_logic": True,
        "supports_loops": True,
        "supports_error_handling": True,
        "self_hosted": True
    },
    "make": {
        "max_modules": 1000,
        "supports_custom_code": True,
        "supports_webhooks": True,
        "supports_conditional_logic": True,
        "supports_loops": True,
        "supports_error_handling": True,
        "self_hosted": False
    },
    "zapier": {
        "max_steps": 100,
        "supports_custom_code": False,
        "supports_webhooks": True,
        "supports_conditional_logic": False,
        "supports_loops": False,
        "supports_error_handling": True,
        "self_hosted": False
    }
}

# Common trigger types with platform mappings
COMMON_TRIGGERS = {
    "google_forms": {
        "name": "Google Forms",
        "events": ["New Response", "Form Submitted"],
        "n8n_type": "n8n-nodes-base.googleFormsTrigger",
        "make_module": "google-forms:watchResponses",
        "zapier_app": "google-forms",
        "zapier_event": "new_response"
    },
    "webhook": {
        "name": "Webhook",
        "events": ["Incoming Webhook", "POST Request", "Webhook Received"],
        "n8n_type": "n8n-nodes-base.webhook",
        "make_module": "webhook:webhook",
        "zapier_app": "webhook",
        "zapier_event": "catch_hook"
    },
    "gmail": {
        "name": "Gmail",
        "events": ["New Email", "New Thread"],
        "n8n_type": "n8n-nodes-base.gmailTrigger",
        "make_module": "gmail:watchEmails",
        "zapier_app": "gmail",
        "zapier_event": "new_email"
    },
    "slack": {
        "name": "Slack",
        "events": ["New Message", "New Channel Message"],
        "n8n_type": "n8n-nodes-base.slackTrigger",
        "make_module": "slack:watchMessages",
        "zapier_app": "slack",
        "zapier_event": "new_message"
    },
    "shopify": {
        "name": "Shopify",
        "events": ["New Order", "Order Created"],
        "n8n_type": "n8n-nodes-base.shopifyTrigger",
        "make_module": "shopify:watchOrders",
        "zapier_app": "shopify",
        "zapier_event": "new_order"
    },
    "airtable": {
        "name": "Airtable",
        "events": ["New Record", "Record Created"],
        "n8n_type": "n8n-nodes-base.airtableTrigger",
        "make_module": "airtable:watchRecords",
        "zapier_app": "airtable",
        "zapier_event": "new_record"
    }
}

# Common action types with platform mappings
COMMON_ACTIONS = {
    "gmail": {
        "name": "Gmail",
        "events": ["Send Email", "Create Draft"],
        "n8n_type": "n8n-nodes-base.gmail",
        "make_module": "gmail:sendEmail",
        "zapier_app": "gmail",
        "zapier_event": "send_email"
    },
    "slack": {
        "name": "Slack",
        "events": ["Send Message", "Post to Channel"],
        "n8n_type": "n8n-nodes-base.slack",
        "make_module": "slack:createMessage",
        "zapier_app": "slack",
        "zapier_event": "send_channel_message"
    },
    "airtable": {
        "name": "Airtable",
        "events": ["Create Record", "Update Record"],
        "n8n_type": "n8n-nodes-base.airtable",
        "make_module": "airtable:createRecord",
        "zapier_app": "airtable",
        "zapier_event": "create_record"
    },
    "notion": {
        "name": "Notion",
        "events": ["Create Page", "Update Database"],
        "n8n_type": "n8n-nodes-base.notion",
        "make_module": "notion:createPage",
        "zapier_app": "notion",
        "zapier_event": "create_page"
    },
    "trello": {
        "name": "Trello",
        "events": ["Create Card", "Update Card"],
        "n8n_type": "n8n-nodes-base.trello",
        "make_module": "trello:createCard",
        "zapier_app": "trello",
        "zapier_event": "create_card"
    },
    "hubspot": {
        "name": "HubSpot",
        "events": ["Create Contact", "Update Contact"],
        "n8n_type": "n8n-nodes-base.hubspot",
        "make_module": "hubspot:createContact",
        "zapier_app": "hubspot",
        "zapier_event": "create_contact"
    },
    "mailchimp": {
        "name": "Mailchimp",
        "events": ["Add Subscriber", "Update Subscriber"],
        "n8n_type": "n8n-nodes-base.mailchimp",
        "make_module": "mailchimp:addSubscriber",
        "zapier_app": "mailchimp",
        "zapier_event": "add_subscriber"
    },
    "google_sheets": {
        "name": "Google Sheets",
        "events": ["Create Row", "Update Row"],
        "n8n_type": "n8n-nodes-base.googleSheets",
        "make_module": "google-sheets:addRow",
        "zapier_app": "google-sheets",
        "zapier_event": "create_spreadsheet_row"
    }
}

# Platform-specific JSON templates
N8N_WORKFLOW_TEMPLATE = {
    "name": "",
    "nodes": [],
    "connections": {},
    "active": False,
    "settings": {
        "executionOrder": "v1"
    },
    "tags": [],
    "triggerCount": 0,
    "updatedAt": None,
    "versionId": None
}

MAKE_WORKFLOW_TEMPLATE = {
    "name": "",
    "flow": [],
    "metadata": {
        "version": 1,
        "scenario": {
            "roundtrips": 1,
            "maxErrors": 3,
            "autoCommit": False,
            "autoCommitTriggerLast": True,
            "sequential": False,
            "slots": None,
            "confidential": False,
            "dataloss": False,
            "dlq": False,
            "freshVariables": False,
            "useMocks": False,
            "useWaitCursor": False,
            "autoCommitTimeout": 0
        }
    }
}

ZAPIER_ZAP_TEMPLATE = {
    "title": "",
    "steps": [],
    "status": "draft"
}

# Default parameter mappings for common workflows
DEFAULT_PARAMETERS = {
    "gmail_send": {
        "to": "{{email_recipient}}",
        "subject": "{{email_subject}}",
        "message": "{{email_body}}",
        "html": "{{email_html}}"
    },
    "slack_message": {
        "channel": "{{slack_channel}}",
        "text": "{{message_text}}",
        "username": "{{bot_name}}"
    },
    "airtable_create": {
        "base": "{{airtable_base}}",
        "table": "{{airtable_table}}",
        "fields": "{{record_fields}}"
    },
    "notion_create": {
        "database": "{{notion_database}}",
        "title": "{{page_title}}",
        "properties": "{{page_properties}}"
    },
    "trello_create": {
        "board": "{{trello_board}}",
        "list": "{{trello_list}}",
        "name": "{{card_name}}",
        "desc": "{{card_description}}"
    },
    "google_forms_trigger": {
        "formId": "{{form_id}}",
        "event": "new_response"
    },
    "webhook_trigger": {
        "httpMethod": "POST",
        "path": "{{webhook_path}}",
        "responseMode": "onReceived"
    }
}

# Node positioning constants
N8N_NODE_SPACING = 200
N8N_START_POSITION = [250, 300]

MAKE_NODE_SPACING = 300
MAKE_START_POSITION = {"x": 0, "y": 0}

# App name normalization mappings
APP_NAME_MAPPINGS = {
    "google forms": "google_forms",
    "google-forms": "google_forms",
    "googleforms": "google_forms",
    "google sheets": "google_sheets",
    "google-sheets": "google_sheets",
    "googlesheets": "google_sheets",
    "google drive": "google_drive",
    "google-drive": "google_drive",
    "googledrive": "google_drive",
    "mail": "gmail",
    "email": "gmail",
    "g-mail": "gmail",
    "microsoft teams": "microsoft_teams",
    "ms teams": "microsoft_teams",
    "teams": "microsoft_teams",
    "air table": "airtable",
    "air-table": "airtable",
    "hub spot": "hubspot",
    "hub-spot": "hubspot",
    "mail chimp": "mailchimp",
    "mail-chimp": "mailchimp",
    "webhooks": "webhook",
    "web hook": "webhook",
    "web-hook": "webhook"
}

# Event name normalization mappings
EVENT_NAME_MAPPINGS = {
    "form submitted": "New Response",
    "form response": "New Response",
    "new form response": "New Response",
    "form submission": "New Response",
    "new submission": "New Response",
    "email received": "New Email",
    "new mail": "New Email",
    "incoming email": "New Email",
    "message received": "New Message",
    "new msg": "New Message",
    "incoming message": "New Message",
    "send mail": "Send Email",
    "send message": "Send Message",
    "post message": "Send Message",
    "create record": "Create Record",
    "add record": "Create Record",
    "new record": "Create Record",
    "create page": "Create Page",
    "add page": "Create Page",
    "new page": "Create Page",
    "create card": "Create Card",
    "add card": "Create Card",
    "new card": "Create Card",
    "create contact": "Create Contact",
    "add contact": "Create Contact",
    "new contact": "Create Contact",
    "add subscriber": "Add Subscriber",
    "create subscriber": "Add Subscriber",
    "new subscriber": "Add Subscriber"
}

# Platform-specific quirks and limitations
PLATFORM_LIMITATIONS = {
    "n8n": {
        "max_nodes": 100,
        "requires_webhook_id": True,
        "supports_conditional_logic": True,
        "supports_loops": True
    },
    "make": {
        "max_modules": 1000,
        "requires_sequential_ids": True,
        "supports_conditional_logic": True,
        "supports_loops": True,
        "supports_error_handling": True
    },
    "zapier": {
        "max_steps": 100,
        "linear_workflow_only": True,
        "supports_conditional_logic": False,
        "supports_loops": False,
        "requires_premium_for_multiple_actions": True
    }
}

# JSON Schema definitions for workflow validation
N8N_WORKFLOW_SCHEMA = {
    "type": "object",
    "required": ["name", "nodes", "connections"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "nodes": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["name", "type", "typeVersion", "position", "id"],
                "properties": {
                    "name": {"type": "string"},
                    "type": {"type": "string"},
                    "typeVersion": {"type": "number"},
                    "position": {
                        "type": "array",
                        "items": {"type": "number"},
                        "minItems": 2,
                        "maxItems": 2
                    },
                    "id": {"type": "string"},
                    "parameters": {"type": "object"}
                }
            }
        },
        "connections": {"type": "object"},
        "active": {"type": "boolean"},
        "settings": {"type": "object"},
        "tags": {"type": "array"}
    }
}

# Make.com workflow schema
MAKE_WORKFLOW_SCHEMA = {
    "type": "object",
    "required": ["name", "flow", "metadata"],
    "properties": {
        "name": {"type": "string", "minLength": 1},
        "flow": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "module", "version", "parameters"],
                "properties": {
                    "id": {"type": "number"},
                    "module": {"type": "string"},
                    "version": {"type": "number"},
                    "parameters": {"type": "object"},
                    "mapper": {"type": "object"},
                    "metadata": {"type": "object"}
                }
            }
        },
        "metadata": {"type": "object"}
    }
}

# Zapier zap schema
ZAPIER_ZAP_SCHEMA = {
    "type": "object",
    "required": ["title", "steps"],
    "properties": {
        "title": {"type": "string", "minLength": 1},
        "steps": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "type", "app", "event"],
                "properties": {
                    "id": {"type": "string"},
                    "type": {"type": "string", "enum": ["trigger", "action"]},
                    "app": {"type": "string"},
                    "event": {"type": "string"},
                    "parameters": {"type": "object"}
                }
            }
        },
        "status": {"type": "string"}
    }
}

# Validation schemas for each platform
VALIDATION_SCHEMAS = {
    "n8n": {
        "required_fields": ["name", "nodes", "connections"],
        "node_required_fields": ["name", "type", "typeVersion", "position", "id"],
        "connection_format": "object_with_node_names"
    },
    "make": {
        "required_fields": ["name", "flow", "metadata"],
        "module_required_fields": ["id", "module", "version", "parameters", "metadata"],
        "id_format": "sequential_integers"
    },
    "zapier": {
        "required_fields": ["title", "steps", "status"],
        "step_required_fields": ["id", "type", "app", "event", "parameters"],
        "step_types": ["trigger", "action"]
    }
}

# Platform-specific schemas dictionary
PLATFORM_SCHEMAS = {
    "n8n": N8N_WORKFLOW_SCHEMA,
    "make": MAKE_WORKFLOW_SCHEMA,
    "zapier": ZAPIER_ZAP_SCHEMA
}

def get_app_mapping(app_name: str) -> str:
    """
    Normalize app name to standard format.
    
    Args:
        app_name: Raw app name from user input
        
    Returns:
        Normalized app name
    """
    normalized = app_name.lower().strip()
    return APP_NAME_MAPPINGS.get(normalized, normalized.replace(" ", "_").replace("-", "_"))

def get_event_mapping(event_name: str) -> str:
    """
    Normalize event name to standard format.
    
    Args:
        event_name: Raw event name from user input
        
    Returns:
        Normalized event name
    """
    normalized = event_name.lower().strip()
    return EVENT_NAME_MAPPINGS.get(normalized, event_name)

def get_platform_node_type(app_name: str, platform: str, is_trigger: bool = False) -> str:
    """
    Get platform-specific node type for an app.
    
    Args:
        app_name: Normalized app name
        platform: Target platform (n8n, make, zapier)
        is_trigger: Whether this is a trigger node
        
    Returns:
        Platform-specific node type
    """
    app_key = get_app_mapping(app_name)
    
    if is_trigger:
        app_config = COMMON_TRIGGERS.get(app_key)
    else:
        app_config = COMMON_ACTIONS.get(app_key)
    
    if not app_config:
        # Fallback for unknown apps
        if platform == "n8n":
            return f"n8n-nodes-base.{app_key}"
        elif platform == "make":
            return f"{app_key}:{'watch' if is_trigger else 'create'}"
        elif platform == "zapier":
            return app_key
    
    platform_key = f"{platform}_{'type' if platform == 'n8n' else 'module' if platform == 'make' else 'app'}"
    return app_config.get(platform_key, app_key)

def get_default_parameters(app_name: str, event_name: str) -> Dict[str, Any]:
    """
    Get default parameters for an app and event combination.
    
    Args:
        app_name: Normalized app name
        event_name: Event name
        
    Returns:
        Default parameters dictionary
    """
    app_key = get_app_mapping(app_name)
    event_key = get_event_mapping(event_name)
    
    # Try to find specific parameter set
    param_key = f"{app_key}_{event_key.lower().replace(' ', '_')}"
    if param_key in DEFAULT_PARAMETERS:
        return DEFAULT_PARAMETERS[param_key].copy()
    
    # Try app-specific defaults
    app_param_key = f"{app_key}_default"
    if app_param_key in DEFAULT_PARAMETERS:
        return DEFAULT_PARAMETERS[app_param_key].copy()
    
    # Return generic defaults
    return {
        "data": "{{trigger_data}}",
        "config": "{{app_config}}"
    }