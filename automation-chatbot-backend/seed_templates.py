"""
Seed database with common workflow templates.

This script populates the database with pre-built workflow templates
for common automation scenarios across n8n, Make.com, and Zapier platforms.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.database import save_workflow_template, get_workflow_templates
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================================
# TEMPLATE DATA
# =====================================================================

TEMPLATES = [
    # ========== ZAPIER TEMPLATES ==========
    {
        "name": "Form to Email Notification",
        "description": "Automatically send an email notification when a Google Form is submitted",
        "platform": "zapier",
        "trigger_type": "google_forms",
        "action_types": ["gmail"],
        "category": "productivity",
        "tags": ["email", "forms", "notifications", "google"],
        "json_template": {
            "title": "Form to Email Notification",
            "steps": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "app": "google-forms",
                    "event": "new_response",
                    "parameters": {
                        "form_id": "{{form_id}}"
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "app": "gmail",
                    "event": "send_email",
                    "parameters": {
                        "to": "{{recipient_email}}",
                        "subject": "New Form Response Received",
                        "body": "A new response was submitted to your form.\\n\\nDetails: {{trigger.response}}"
                    }
                }
            ],
            "status": "draft"
        }
    },
    {
        "name": "Slack to Airtable Logger",
        "description": "Log important Slack messages to an Airtable base for record keeping",
        "platform": "zapier",
        "trigger_type": "slack",
        "action_types": ["airtable"],
        "category": "productivity",
        "tags": ["slack", "airtable", "logging", "database"],
        "json_template": {
            "title": "Slack to Airtable Logger",
            "steps": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "app": "slack",
                    "event": "new_message_in_channels",
                    "parameters": {
                        "channel": "{{slack_channel}}"
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "app": "airtable",
                    "event": "create_record",
                    "parameters": {
                        "base": "{{airtable_base}}",
                        "table": "{{airtable_table}}",
                        "fields": {
                            "Message": "{{trigger.text}}",
                            "User": "{{trigger.user}}",
                            "Timestamp": "{{trigger.timestamp}}",
                            "Channel": "{{trigger.channel}}"
                        }
                    }
                }
            ],
            "status": "draft"
        }
    },
    
    # ========== N8N TEMPLATES ==========
    {
        "name": "Webhook to Multiple Services",
        "description": "Receive webhook data and distribute it to multiple services (Email, Slack, Database)",
        "platform": "n8n",
        "trigger_type": "webhook",
        "action_types": ["gmail", "slack", "airtable"],
        "category": "integration",
        "tags": ["webhook", "multi-action", "integration"],
        "json_template": {
            "name": "Webhook to Multiple Services",
            "nodes": [
                {
                    "id": "webhook-1",
                    "name": "Webhook",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 1,
                    "position": [250, 300],
                    "parameters": {
                        "path": "{{webhook_path}}",
                        "httpMethod": "POST"
                    }
                },
                {
                    "id": "gmail-1",
                    "name": "Send Email",
                    "type": "n8n-nodes-base.gmail",
                    "typeVersion": 1,
                    "position": [450, 200],
                    "parameters": {
                        "to": "{{email_recipient}}",
                        "subject": "Webhook Received",
                        "message": "Data: {{$json}}"
                    }
                },
                {
                    "id": "slack-1",
                    "name": "Post to Slack",
                    "type": "n8n-nodes-base.slack",
                    "typeVersion": 1,
                    "position": [450, 300],
                    "parameters": {
                        "channel": "{{slack_channel}}",
                        "text": "New webhook data received"
                    }
                },
                {
                    "id": "airtable-1",
                    "name": "Save to Airtable",
                    "type": "n8n-nodes-base.airtable",
                    "typeVersion": 1,
                    "position": [450, 400],
                    "parameters": {
                        "operation": "append",
                        "base": "{{airtable_base}}",
                        "table": "{{airtable_table}}"
                    }
                }
            ],
            "connections": {
                "Webhook": {
                    "main": [
                        [
                            {"node": "Send Email", "type": "main", "index": 0},
                            {"node": "Post to Slack", "type": "main", "index": 0},
                            {"node": "Save to Airtable", "type": "main", "index": 0}
                        ]
                    ]
                }
            },
            "active": False,
            "settings": {},
            "tags": []
        }
    },
    {
        "name": "E-commerce Order Processing",
        "description": "Process new e-commerce orders: send confirmation email and create invoice",
        "platform": "n8n",
        "trigger_type": "shopify",
        "action_types": ["gmail", "google_docs"],
        "category": "e-commerce",
        "tags": ["shopify", "orders", "email", "invoice"],
        "json_template": {
            "name": "E-commerce Order Processing",
            "nodes": [
                {
                    "id": "shopify-trigger",
                    "name": "Shopify Order",
                    "type": "n8n-nodes-base.shopifyTrigger",
                    "typeVersion": 1,
                    "position": [250, 300],
                    "parameters": {
                        "event": "orders/create"
                    }
                },
                {
                    "id": "gmail-1",
                    "name": "Send Confirmation",
                    "type": "n8n-nodes-base.gmail",
                    "typeVersion": 1,
                    "position": [450, 250],
                    "parameters": {
                        "to": "{{$json.customer.email}}",
                        "subject": "Order Confirmation #{{$json.order_number}}",
                        "message": "Thank you for your order!"
                    }
                },
                {
                    "id": "docs-1",
                    "name": "Create Invoice",
                    "type": "n8n-nodes-base.googleDocs",
                    "typeVersion": 1,
                    "position": [450, 350],
                    "parameters": {
                        "operation": "create",
                        "title": "Invoice {{$json.order_number}}"
                    }
                }
            ],
            "connections": {
                "Shopify Order": {
                    "main": [
                        [
                            {"node": "Send Confirmation", "type": "main", "index": 0},
                            {"node": "Create Invoice", "type": "main", "index": 0}
                        ]
                    ]
                }
            },
            "active": False,
            "settings": {},
            "tags": []
        }
    },
    
    # ========== MAKE.COM TEMPLATES ==========
    {
        "name": "Social Media to Content Calendar",
        "description": "Monitor social media mentions and add them to a content calendar",
        "platform": "make",
        "trigger_type": "twitter",
        "action_types": ["notion"],
        "category": "marketing",
        "tags": ["social-media", "twitter", "notion", "content"],
        "json_template": {
            "name": "Social Media to Content Calendar",
            "flow": [
                {
                    "id": 1,
                    "module": "twitter:watchMentions",
                    "version": 1,
                    "parameters": {
                        "username": "{{twitter_username}}"
                    },
                    "metadata": {
                        "designer": {"x": 0, "y": 0}
                    }
                },
                {
                    "id": 2,
                    "module": "notion:createPage",
                    "version": 1,
                    "parameters": {
                        "database": "{{notion_database}}",
                        "title": "{{1.text}}"
                    },
                    "mapper": {
                        "title": "{{1.text}}",
                        "author": "{{1.user}}",
                        "date": "{{1.created_at}}"
                    },
                    "metadata": {
                        "designer": {"x": 300, "y": 0}
                    }
                }
            ],
            "metadata": {
                "version": 1,
                "scenario": {
                    "roundtrips": 1,
                    "maxErrors": 3
                }
            }
        }
    },
    {
        "name": "CRM Contact Sync",
        "description": "Sync new contacts from forms to CRM and send welcome email",
        "platform": "make",
        "trigger_type": "webhook",
        "action_types": ["hubspot", "gmail"],
        "category": "sales",
        "tags": ["crm", "hubspot", "contacts", "email"],
        "json_template": {
            "name": "CRM Contact Sync",
            "flow": [
                {
                    "id": 1,
                    "module": "webhook:webhook",
                    "version": 1,
                    "parameters": {
                        "hook": "contact_submission"
                    },
                    "metadata": {
                        "designer": {"x": 0, "y": 0}
                    }
                },
                {
                    "id": 2,
                    "module": "hubspot:createContact",
                    "version": 1,
                    "parameters": {
                        "email": "{{1.email}}",
                        "firstname": "{{1.first_name}}",
                        "lastname": "{{1.last_name}}"
                    },
                    "mapper": {
                        "email": "{{1.email}}",
                        "firstname": "{{1.first_name}}",
                        "lastname": "{{1.last_name}}"
                    },
                    "metadata": {
                        "designer": {"x": 300, "y": 0}
                    }
                },
                {
                    "id": 3,
                    "module": "gmail:sendEmail",
                    "version": 1,
                    "parameters": {
                        "to": "{{1.email}}",
                        "subject": "Welcome!",
                        "text": "Thanks for signing up!"
                    },
                    "mapper": {
                        "to": "{{1.email}}"
                    },
                    "metadata": {
                        "designer": {"x": 600, "y": 0}
                    }
                }
            ],
            "metadata": {
                "version": 1,
                "scenario": {
                    "roundtrips": 1,
                    "maxErrors": 3
                }
            }
        }
    },
    {
        "name": "Invoice to Accounting Automation",
        "description": "When invoice is created, send to client and log in accounting software",
        "platform": "make",
        "trigger_type": "stripe",
        "action_types": ["gmail", "quickbooks"],
        "category": "finance",
        "tags": ["stripe", "invoices", "accounting", "quickbooks"],
        "json_template": {
            "name": "Invoice to Accounting Automation",
            "flow": [
                {
                    "id": 1,
                    "module": "stripe:watchInvoices",
                    "version": 1,
                    "parameters": {
                        "event": "invoice.created"
                    },
                    "metadata": {
                        "designer": {"x": 0, "y": 0}
                    }
                },
                {
                    "id": 2,
                    "module": "gmail:sendEmail",
                    "version": 1,
                    "parameters": {
                        "to": "{{1.customer_email}}",
                        "subject": "Invoice #{{1.number}}",
                        "text": "Your invoice is attached."
                    },
                    "mapper": {
                        "to": "{{1.customer_email}}"
                    },
                    "metadata": {
                        "designer": {"x": 300, "y": -50}
                    }
                },
                {
                    "id": 3,
                    "module": "quickbooks:createInvoice",
                    "version": 1,
                    "parameters": {
                        "customer": "{{1.customer}}",
                        "amount": "{{1.total}}"
                    },
                    "mapper": {
                        "customer": "{{1.customer}}",
                        "amount": "{{1.total}}"
                    },
                    "metadata": {
                        "designer": {"x": 300, "y": 50}
                    }
                }
            ],
            "metadata": {
                "version": 1,
                "scenario": {
                    "roundtrips": 1,
                    "maxErrors": 3
                }
            }
        }
    },
    
    # ========== MORE ZAPIER TEMPLATES ==========
    {
        "name": "GitHub to Project Management",
        "description": "Create project tasks automatically when GitHub issues are opened",
        "platform": "zapier",
        "trigger_type": "github",
        "action_types": ["trello"],
        "category": "productivity",
        "tags": ["github", "trello", "issues", "project-management"],
        "json_template": {
            "title": "GitHub to Project Management",
            "steps": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "app": "github",
                    "event": "new_issue",
                    "parameters": {
                        "repository": "{{repository}}"
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "app": "trello",
                    "event": "create_card",
                    "parameters": {
                        "board": "{{trello_board}}",
                        "list": "{{trello_list}}",
                        "name": "{{trigger.title}}",
                        "desc": "{{trigger.body}}\\n\\nGitHub Issue: {{trigger.url}}"
                    }
                }
            ],
            "status": "draft"
        }
    },
    {
        "name": "Customer Feedback to Database",
        "description": "Collect customer feedback from multiple sources into a central database",
        "platform": "zapier",
        "trigger_type": "typeform",
        "action_types": ["airtable", "slack"],
        "category": "productivity",
        "tags": ["feedback", "typeform", "airtable", "slack"],
        "json_template": {
            "title": "Customer Feedback to Database",
            "steps": [
                {
                    "id": "trigger-1",
                    "type": "trigger",
                    "app": "typeform",
                    "event": "new_entry",
                    "parameters": {
                        "form": "{{typeform_id}}"
                    }
                },
                {
                    "id": "action-1",
                    "type": "action",
                    "app": "airtable",
                    "event": "create_record",
                    "parameters": {
                        "base": "{{airtable_base}}",
                        "table": "Feedback",
                        "fields": {
                            "Response": "{{trigger.answers}}",
                            "Date": "{{trigger.submitted_at}}",
                            "Rating": "{{trigger.rating}}"
                        }
                    }
                },
                {
                    "id": "action-2",
                    "type": "action",
                    "app": "slack",
                    "event": "send_channel_message",
                    "parameters": {
                        "channel": "{{slack_channel}}",
                        "text": "New feedback received! Rating: {{trigger.rating}}/5"
                    }
                }
            ],
            "status": "draft"
        }
    }
]


# =====================================================================
# SEEDING FUNCTIONS
# =====================================================================

async def seed_templates():
    """Seed the database with workflow templates."""
    logger.info(f"Starting to seed {len(TEMPLATES)} templates...")
    
    # Check existing templates
    try:
        existing_templates = await get_workflow_templates(limit=1000)
        existing_names = {t.get("name") for t in existing_templates}
        logger.info(f"Found {len(existing_templates)} existing templates")
    except Exception as e:
        logger.warning(f"Could not fetch existing templates: {e}")
        existing_names = set()
    
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for template in TEMPLATES:
        try:
            # Skip if template already exists
            if template["name"] in existing_names:
                logger.info(f"⏭️  Skipping existing template: {template['name']}")
                skip_count += 1
                continue
            
            # Save template
            result = await save_workflow_template(template)
            logger.info(f"✅ Created template: {template['name']} (ID: {result['id']})")
            success_count += 1
            
        except Exception as e:
            logger.error(f"❌ Error creating template '{template['name']}': {str(e)}")
            error_count += 1
    
    # Summary
    logger.info("=" * 80)
    logger.info("SEEDING COMPLETE")
    logger.info("=" * 80)
    logger.info(f"✅ Successfully created: {success_count}")
    logger.info(f"⏭️  Skipped (already exist): {skip_count}")
    logger.info(f"❌ Errors: {error_count}")
    logger.info(f"📊 Total templates in database: {success_count + len(existing_names)}")
    logger.info("=" * 80)


async def main():
    """Main entry point."""
    try:
        await seed_templates()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

