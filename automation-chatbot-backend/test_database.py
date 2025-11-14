"""
Test script for database operations.

This script tests all database CRUD operations to ensure Supabase integration
is working correctly.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.models.database import (
    create_workflow,
    get_workflow,
    update_workflow,
    delete_workflow,
    list_workflows,
    create_conversation,
    get_conversation,
    add_message_to_conversation,
    save_workflow_template,
    get_workflow_templates,
    get_database_stats
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_workflow_operations():
    """Test workflow CRUD operations."""
    logger.info("=" * 80)
    logger.info("TESTING WORKFLOW OPERATIONS")
    logger.info("=" * 80)
    
    try:
        # Create workflow
        logger.info("\n1. Testing CREATE workflow...")
        workflow_data = {
            "name": "Test Workflow",
            "description": "A test workflow for database testing",
            "platform": "n8n",
            "workflow_json": {
                "name": "Test",
                "nodes": [],
                "connections": {}
            },
            "status": "draft",
            "tags": ["test", "database"]
        }
        
        workflow = await create_workflow(workflow_data)
        workflow_id = workflow["id"]
        logger.info(f"✅ Created workflow: {workflow_id}")
        
        # Get workflow
        logger.info("\n2. Testing GET workflow...")
        retrieved = await get_workflow(workflow_id)
        assert retrieved["id"] == workflow_id
        assert retrieved["name"] == "Test Workflow"
        logger.info(f"✅ Retrieved workflow: {retrieved['name']}")
        
        # Update workflow
        logger.info("\n3. Testing UPDATE workflow...")
        updated = await update_workflow(workflow_id, {
            "name": "Updated Test Workflow",
            "status": "active"
        })
        assert updated["name"] == "Updated Test Workflow"
        assert updated["status"] == "active"
        logger.info(f"✅ Updated workflow: {updated['name']} ({updated['status']})")
        
        # List workflows
        logger.info("\n4. Testing LIST workflows...")
        workflows = await list_workflows(platform="n8n", limit=10)
        assert len(workflows) > 0
        logger.info(f"✅ Found {len(workflows)} workflows")
        
        # Delete workflow
        logger.info("\n5. Testing DELETE workflow...")
        success = await delete_workflow(workflow_id)
        assert success == True
        logger.info(f"✅ Deleted workflow: {workflow_id}")
        
        # Verify deletion
        deleted = await get_workflow(workflow_id)
        assert deleted is None
        logger.info(f"✅ Verified deletion")
        
        logger.info("\n✅ All workflow operations passed!")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ Workflow operations failed: {str(e)}")
        return False


async def test_conversation_operations():
    """Test conversation CRUD operations."""
    logger.info("\n" + "=" * 80)
    logger.info("TESTING CONVERSATION OPERATIONS")
    logger.info("=" * 80)
    
    try:
        # Create conversation
        logger.info("\n1. Testing CREATE conversation...")
        conversation_data = {
            "session_id": "test-session-12345",
            "platform": "n8n",
            "messages": [],
            "status": "active"
        }
        
        conversation = await create_conversation(conversation_data)
        session_id = conversation["session_id"]
        logger.info(f"✅ Created conversation: {session_id}")
        
        # Get conversation
        logger.info("\n2. Testing GET conversation...")
        retrieved = await get_conversation(session_id)
        assert retrieved["session_id"] == session_id
        logger.info(f"✅ Retrieved conversation: {retrieved['session_id']}")
        
        # Add messages
        logger.info("\n3. Testing ADD messages...")
        await add_message_to_conversation(session_id, {
            "role": "user",
            "content": "Hello!",
            "timestamp": "2025-01-10T12:00:00Z"
        })
        await add_message_to_conversation(session_id, {
            "role": "assistant",
            "content": "Hi there!",
            "timestamp": "2025-01-10T12:00:01Z"
        })
        
        updated = await get_conversation(session_id)
        assert len(updated["messages"]) == 2
        logger.info(f"✅ Added 2 messages, total: {len(updated['messages'])}")
        
        # Verify message content
        assert updated["messages"][0]["role"] == "user"
        assert updated["messages"][1]["role"] == "assistant"
        logger.info(f"✅ Message content verified")
        
        logger.info("\n✅ All conversation operations passed!")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ Conversation operations failed: {str(e)}")
        return False


async def test_template_operations():
    """Test template operations."""
    logger.info("\n" + "=" * 80)
    logger.info("TESTING TEMPLATE OPERATIONS")
    logger.info("=" * 80)
    
    try:
        # Create template
        logger.info("\n1. Testing CREATE template...")
        template_data = {
            "name": "Test Template",
            "description": "A test template",
            "platform": "zapier",
            "trigger_type": "webhook",
            "action_types": ["gmail"],
            "json_template": {
                "title": "Test",
                "steps": []
            },
            "category": "testing",
            "tags": ["test"]
        }
        
        template = await save_workflow_template(template_data)
        template_id = template["id"]
        logger.info(f"✅ Created template: {template_id}")
        
        # Get templates
        logger.info("\n2. Testing GET templates...")
        templates = await get_workflow_templates(platform="zapier", limit=10)
        assert len(templates) > 0
        logger.info(f"✅ Found {len(templates)} templates")
        
        logger.info("\n✅ All template operations passed!")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ Template operations failed: {str(e)}")
        return False


async def test_database_stats():
    """Test database statistics."""
    logger.info("\n" + "=" * 80)
    logger.info("TESTING DATABASE STATISTICS")
    logger.info("=" * 80)
    
    try:
        logger.info("\n1. Testing GET database stats...")
        stats = await get_database_stats()
        
        assert "workflows_count" in stats
        assert "conversations_count" in stats
        assert "templates_count" in stats
        
        logger.info(f"✅ Workflows: {stats['workflows_count']}")
        logger.info(f"✅ Conversations: {stats['conversations_count']}")
        logger.info(f"✅ Templates: {stats['templates_count']}")
        
        logger.info("\n✅ Database statistics passed!")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ Database statistics failed: {str(e)}")
        return False


async def main():
    """Run all tests."""
    logger.info("=" * 80)
    logger.info("DATABASE OPERATIONS TEST SUITE")
    logger.info("=" * 80)
    
    results = {
        "workflow": False,
        "conversation": False,
        "template": False,
        "stats": False
    }
    
    # Run tests
    results["workflow"] = await test_workflow_operations()
    results["conversation"] = await test_conversation_operations()
    results["template"] = await test_template_operations()
    results["stats"] = await test_database_stats()
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{test_name.capitalize()} Operations: {status}")
    
    all_passed = all(results.values())
    
    logger.info("\n" + "=" * 80)
    if all_passed:
        logger.info("✅ ALL TESTS PASSED!")
    else:
        logger.info("❌ SOME TESTS FAILED")
    logger.info("=" * 80)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

