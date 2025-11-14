"""
Example usage of the AI Service for workflow automation.

This file demonstrates how to use the AI service to process user conversations
and generate workflow automations.
"""

import asyncio
import json
import os
from typing import List

# Set up environment variables for testing
os.environ["OPENAI_API_KEY"] = "your-openai-api-key-here"
os.environ["OPENAI_MODEL"] = "gpt-4-turbo-preview"
os.environ["ENVIRONMENT"] = "development"

from app.services.ai_service import AIService, ConversationResponse
from app.models.schema import ChatMessage, InsertChatMessage


async def example_simple_conversation():
    """
    Example: Simple conversation flow for form-to-email automation.
    """
    print("🤖 Example: Simple Form-to-Email Automation")
    print("=" * 50)
    
    # Initialize AI service
    ai_service = AIService()
    
    # Simulate user message
    user_message = "Send me an email when someone fills out my contact form"
    
    print(f"👤 User: {user_message}")
    
    # Process the conversation
    response: ConversationResponse = await ai_service.process_conversation(
        messages=[],  # No previous conversation
        current_message=user_message
    )
    
    print(f"🤖 AI: {response.message}")
    print(f"📊 Confidence: {response.confidence}")
    print(f"🎯 Workflow Ready: {response.workflow_ready}")
    print(f"📝 Stage: {response.conversation_stage}")
    
    if response.intent:
        print(f"🧠 Intent: {json.dumps(response.intent, indent=2)}")
    
    if response.clarifying_questions:
        print("❓ Clarifying Questions:")
        for i, question in enumerate(response.clarifying_questions, 1):
            print(f"   {i}. {question}")
    
    # If workflow is ready, generate it
    if response.workflow_ready:
        print("\n🔧 Generating Workflow...")
        workflow_json = await ai_service.generate_workflow_json(
            intent=response.intent,
            platform="zapier",
            workflow_name=response.suggested_name
        )
        print(f"✅ Generated Workflow: {json.dumps(workflow_json, indent=2)}")
    
    print(f"\n💰 Token Usage: {ai_service.get_token_usage_stats()}")


async def example_multi_turn_conversation():
    """
    Example: Multi-turn conversation with clarifications.
    """
    print("\n🤖 Example: Multi-turn Conversation")
    print("=" * 50)
    
    ai_service = AIService()
    conversation_history: List[ChatMessage] = []
    
    # Conversation turns
    turns = [
        "I want to automate something with my emails",
        "When I get an email from a customer, I want to create a task",
        "Create a task in Trello with the email subject as the title",
        "The email should come to my support@company.com address"
    ]
    
    for i, user_input in enumerate(turns, 1):
        print(f"\n--- Turn {i} ---")
        print(f"👤 User: {user_input}")
        
        # Process conversation
        response = await ai_service.process_conversation(
            messages=conversation_history,
            current_message=user_input
        )
        
        print(f"🤖 AI: {response.message}")
        print(f"📊 Confidence: {response.confidence:.2f}")
        print(f"📝 Stage: {response.conversation_stage}")
        
        # Add messages to history
        conversation_history.extend([
            ChatMessage(
                id=f"user_{i}",
                workflowId="example_session",
                role="user",
                content=user_input,
                timestamp="2024-01-01T00:00:00Z"
            ),
            ChatMessage(
                id=f"ai_{i}",
                workflowId="example_session",
                role="assistant",
                content=response.message,
                timestamp="2024-01-01T00:00:00Z"
            )
        ])
        
        if response.clarifying_questions:
            print("❓ Questions:")
            for q in response.clarifying_questions:
                print(f"   • {q}")
        
        if response.workflow_ready:
            print("✅ Workflow is ready to generate!")
            break
    
    print(f"\n💰 Total Token Usage: {ai_service.get_token_usage_stats()}")


async def example_workflow_generation():
    """
    Example: Generate workflows for different platforms.
    """
    print("\n🤖 Example: Workflow Generation for Different Platforms")
    print("=" * 60)
    
    ai_service = AIService()
    
    # Sample intent (would normally come from conversation processing)
    sample_intent = {
        "trigger": {"app": "Gmail", "event": "New Email"},
        "actions": [{"app": "Trello", "event": "Create Card"}],
        "confidence": 0.9,
        "platform_suggestion": "zapier"
    }
    
    platforms = ["zapier", "make", "n8n"]
    
    for platform in platforms:
        print(f"\n--- {platform.upper()} Workflow ---")
        
        try:
            workflow_json = await ai_service.generate_workflow_json(
                intent=sample_intent,
                platform=platform,
                workflow_name=f"Email to {platform.title()}"
            )
            
            print(f"✅ Generated {platform} workflow:")
            print(json.dumps(workflow_json, indent=2))
            
        except Exception as e:
            print(f"❌ Error generating {platform} workflow: {e}")


async def example_platform_recommendation():
    """
    Example: Get platform recommendations based on workflow complexity.
    """
    print("\n🤖 Example: Platform Recommendations")
    print("=" * 40)
    
    ai_service = AIService()
    
    scenarios = [
        {
            "complexity": "simple",
            "experience": "beginner",
            "apps": ["Google Forms", "Gmail"]
        },
        {
            "complexity": "medium",
            "experience": "intermediate",
            "apps": ["Shopify", "Slack", "Google Sheets"]
        },
        {
            "complexity": "complex",
            "experience": "advanced",
            "apps": ["Webhook", "Custom API", "Database", "Multiple conditions"]
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n--- Scenario {i} ---")
        print(f"Complexity: {scenario['complexity']}")
        print(f"Experience: {scenario['experience']}")
        print(f"Apps: {', '.join(scenario['apps'])}")
        
        recommendation = await ai_service.recommend_platform(
            workflow_complexity=scenario['complexity'],
            user_experience=scenario['experience'],
            apps_involved=scenario['apps']
        )
        
        print(f"🎯 Recommended: {recommendation['recommended_platform']}")
        print(f"📝 Reason: {recommendation['reason']}")
        print(f"📊 Confidence: {recommendation['confidence']}")
        print(f"🔄 Alternatives: {', '.join(recommendation['alternatives'])}")


async def example_error_handling():
    """
    Example: Error handling and edge cases.
    """
    print("\n🤖 Example: Error Handling")
    print("=" * 30)
    
    ai_service = AIService()
    
    # Test with unclear input
    unclear_messages = [
        "help",
        "I need automation",
        "make it work",
        "xyz123 random text"
    ]
    
    for message in unclear_messages:
        print(f"\n👤 User: {message}")
        
        try:
            response = await ai_service.process_conversation(
                messages=[],
                current_message=message
            )
            
            print(f"🤖 AI: {response.message}")
            print(f"📊 Confidence: {response.confidence:.2f}")
            
            if response.confidence < 0.3:
                print("⚠️  Low confidence - AI is asking for clarification")
            
        except Exception as e:
            print(f"❌ Error: {e}")


async def main():
    """
    Run all examples.
    """
    print("🚀 AI Service Examples")
    print("=" * 80)
    
    try:
        # Run examples
        await example_simple_conversation()
        await example_multi_turn_conversation()
        await example_workflow_generation()
        await example_platform_recommendation()
        await example_error_handling()
        
        print("\n✅ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Example failed: {e}")
        print("Make sure you have set OPENAI_API_KEY in your environment")


if __name__ == "__main__":
    # Run examples
    asyncio.run(main())


# Testing checklist (as requested in the requirements):
"""
🧪 TESTING CHECKLIST:

✅ Test with simple request: "Send email when form submitted"
   - Should extract: trigger=Google Forms, action=Gmail
   - Should have high confidence (>0.7)
   - Should be ready to generate workflow

✅ Test with vague request: "Automate my emails"
   - Should have low confidence (<0.5)
   - Should ask clarifying questions
   - Should guide user to be more specific

✅ Test with complex request: "When form submitted, send email and update spreadsheet"
   - Should extract multiple actions
   - Should handle sequential workflow
   - Should suggest appropriate platform

✅ Test error handling with invalid API key
   - Should raise AIServiceError
   - Should return user-friendly error message
   - Should not expose technical details

✅ Test conversation flow with multiple clarifications
   - Should maintain context across turns
   - Should improve confidence with more information
   - Should eventually reach workflow-ready state

Additional test scenarios:
- Rate limiting (429 errors)
- Token limit exceeded
- Network timeouts
- Invalid JSON responses from AI
- Malformed user input
- Very long conversations
- Platform-specific limitations
"""
