"""
LangChain prompt templates for workflow automation AI service.
"""

from langchain.prompts import PromptTemplate

# Intent extraction prompt template
INTENT_EXTRACTION_PROMPT = PromptTemplate(
    input_variables=["user_input", "conversation_history"],
    template="""You are an automation workflow expert. Extract the trigger and actions from the user's request.

Conversation History:
{conversation_history}

Current User Request: {user_input}

Analyze the user's request and return a JSON response with the following structure:
{{
    "trigger": {{"app": "string", "event": "string"}},
    "actions": [{{"app": "string", "event": "string"}}],
    "missing_info": ["string"],
    "confidence": 0.0,
    "platform_suggestion": "string",
    "conversation_stage": "string"
}}

Guidelines:
- Focus on these platforms: n8n, Make.com, Zapier
- Common apps: Google Forms, Gmail, Slack, Webhooks, Airtable, Notion, Shopify, HubSpot, Mailchimp, Discord, Trello, Asana
- Common triggers: "New Response", "New Email", "New Order", "Webhook Received", "New Row", "New Message"
- Common actions: "Send Email", "Send Message", "Create Record", "Update Record", "Post Message", "Create Page"
- Confidence should be 0.0-1.0 based on clarity of the request
- Platform suggestion should be "zapier", "make", or "n8n" based on the workflow complexity
- Conversation stage: "greeting", "intent_gathering", "clarification", "ready_to_generate", "complete"
- If the request is unclear, set confidence low and add specific missing information

Examples:
- "Send email when form submitted" → trigger: Google Forms/New Response, action: Gmail/Send Email
- "Notify team in Slack when new order" → trigger: Shopify/New Order, action: Slack/Send Message
- "Add form responses to spreadsheet" → trigger: Google Forms/New Response, action: Google Sheets/Create Row

Return ONLY the JSON response, no additional text."""
)

# Clarification questions prompt template
CLARIFICATION_PROMPT = PromptTemplate(
    input_variables=["intent", "missing_info", "platform", "conversation_history"],
    template="""Based on this workflow intent, generate 2-3 clarifying questions to get missing information.

Intent: {intent}
Missing Information: {missing_info}
Target Platform: {platform}
Conversation History: {conversation_history}

Generate natural, conversational questions that help complete the workflow setup.
Be specific about what information you need (e.g., email addresses, form URLs, channel names, etc.)

Guidelines:
- Ask about specific configuration details needed for the workflow
- Be conversational and helpful, not robotic
- Focus on the most critical missing information first
- Provide examples when helpful
- Keep questions concise but clear

Return a JSON array of questions:
["Question 1", "Question 2", "Question 3"]

Examples:
- For email workflows: "What email address should receive the notifications?"
- For Slack workflows: "Which Slack channel should I send messages to?"
- For form workflows: "What's the URL of your Google Form?"
- For spreadsheet workflows: "Which Google Sheet should I update?"

Return ONLY the JSON array, no additional text."""
)

# Workflow generation prompt template
WORKFLOW_GENERATION_PROMPT = PromptTemplate(
    input_variables=["platform", "trigger", "actions", "parameters", "workflow_name"],
    template="""Generate a {platform} workflow JSON based on this information:

Workflow Name: {workflow_name}
Trigger: {trigger}
Actions: {actions}
Parameters: {parameters}

Return ONLY valid JSON matching the {platform} schema format.

For Zapier format:
{{
    "name": "workflow_name",
    "trigger": {{"app": "app_name", "event": "event_name", "config": {{}}}},
    "actions": [{{"app": "app_name", "action": "action_name", "config": {{}}}}],
    "metadata": {{"created_by": "WorkflowBridge", "platform": "zapier"}}
}}

For Make format:
{{
    "scenario": {{
        "name": "workflow_name",
        "modules": [
            {{"service": "service_name", "operation": "operation_name", "config": {{}}}},
            {{"service": "service_name", "operation": "operation_name", "config": {{}}}}
        ],
        "metadata": {{"created_by": "WorkflowBridge", "platform": "make"}}
    }}
}}

For n8n format:
{{
    "name": "workflow_name",
    "nodes": [
        {{"type": "n8n-nodes-base.trigger", "name": "Trigger", "config": {{}}}},
        {{"type": "n8n-nodes-base.action", "name": "Action", "config": {{}}}}
    ],
    "connections": {{"Trigger": {{"main": [["Action"]]}}}},
    "metadata": {{"created_by": "WorkflowBridge", "platform": "n8n"}}
}}

Include all required fields and proper structure for the target platform.
Use the provided parameters to fill in configuration details.
Ensure the JSON is valid and complete.

Return ONLY the JSON, no additional text."""
)

# Workflow name suggestion prompt template
WORKFLOW_NAME_SUGGESTION_PROMPT = PromptTemplate(
    input_variables=["trigger", "actions"],
    template="""Suggest a concise workflow name (2-5 words) for this automation:

Trigger: {trigger}
Actions: {actions}

Guidelines:
- Keep it short and descriptive
- Use format: "Source to Destination" or "Action Description"
- Be specific about what the workflow does
- Use common terminology users would understand

Examples:
- Google Forms + Gmail → "Form to Email"
- Shopify + Slack → "Order to Slack"
- Webhook + Notion → "Webhook to Notion"
- Google Forms + Mailchimp + HubSpot → "Lead Generation Flow"
- Gmail + Trello → "Email to Task"

Return ONLY the suggested name, no additional text."""
)

# Conversation response prompt template
CONVERSATION_RESPONSE_PROMPT = PromptTemplate(
    input_variables=["user_message", "intent", "conversation_stage", "missing_info"],
    template="""Generate a helpful, conversational response for the user based on their workflow automation request.

User Message: {user_message}
Extracted Intent: {intent}
Conversation Stage: {conversation_stage}
Missing Information: {missing_info}

Guidelines:
- Be friendly and helpful
- Acknowledge what you understood from their request
- If information is missing, ask clarifying questions naturally
- If the intent is clear, summarize what you'll build
- Use emojis sparingly and appropriately
- Keep responses concise but informative
- Guide the user through the next steps

Response should be conversational and match these stages:
- greeting: Welcome and ask what they want to automate
- intent_gathering: Ask for more details about their workflow
- clarification: Ask specific questions about missing details
- ready_to_generate: Confirm the workflow and offer to build it
- complete: Celebrate completion and offer next steps

Return a natural language response that moves the conversation forward."""
)

# Error handling prompt template
ERROR_HANDLING_PROMPT = PromptTemplate(
    input_variables=["error_type", "user_message", "context"],
    template="""Generate a helpful error response for the user when something goes wrong.

Error Type: {error_type}
User Message: {user_message}
Context: {context}

Guidelines:
- Be apologetic but not overly dramatic
- Explain what went wrong in simple terms
- Offer a solution or next steps
- Keep the user engaged and willing to try again
- Don't expose technical details

Common error types:
- api_error: "I'm having trouble connecting to my AI service right now"
- rate_limit: "I'm getting a lot of requests right now, please try again in a moment"
- unclear_intent: "I'm not quite sure what you want to automate"
- invalid_workflow: "That workflow combination isn't possible"
- missing_info: "I need a few more details to build this workflow"

Return a helpful, user-friendly error message."""
)

# Platform recommendation prompt template
PLATFORM_RECOMMENDATION_PROMPT = PromptTemplate(
    input_variables=["workflow_complexity", "user_experience", "apps_involved"],
    template="""Recommend the best automation platform for this workflow:

Workflow Complexity: {workflow_complexity}
User Experience Level: {user_experience}
Apps Involved: {apps_involved}

Platform Characteristics:
- Zapier: Best for beginners, simple linear workflows, popular apps
- Make: Good for intermediate users, visual workflows, complex logic
- n8n: Best for advanced users, custom code, self-hosted, complex workflows

Consider:
- Number of steps in the workflow
- Need for conditional logic or branching
- User's technical skill level
- App availability on each platform
- Workflow complexity (simple trigger-action vs multi-step)

Return a JSON response:
{{
    "recommended_platform": "platform_name",
    "reason": "explanation",
    "confidence": 0.0,
    "alternatives": ["platform1", "platform2"]
}}

Return ONLY the JSON response."""
)