from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime

from app.models.schema import (
    Workflow, WorkflowCreate, WorkflowUpdate,
    ChatMessage, ChatMessageCreate,
    Template, WorkflowNode, WorkflowConnection
)
from app.services.supabase_client import get_supabase_client

class StorageService:
    """Storage service for managing workflows, chat messages, and templates"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        # In-memory storage for now (replace with Supabase later)
        self._workflows: Dict[str, Workflow] = {}
        self._chat_messages: Dict[str, List[ChatMessage]] = {}
        self._templates: List[Template] = self._get_default_templates()

    # Workflow methods
    async def get_all_workflows(self) -> List[Workflow]:
        """Get all workflows"""
        return list(self._workflows.values())

    async def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        """Get a workflow by ID"""
        return self._workflows.get(workflow_id)

    async def create_workflow(self, workflow: WorkflowCreate) -> Workflow:
        """Create a new workflow"""
        new_workflow = Workflow(
            id=str(uuid4()),
            **workflow.dict(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self._workflows[new_workflow.id] = new_workflow
        return new_workflow

    async def update_workflow(self, workflow_id: str, workflow: WorkflowUpdate) -> Optional[Workflow]:
        """Update a workflow"""
        if workflow_id not in self._workflows:
            return None
        
        existing = self._workflows[workflow_id]
        updated_workflow = Workflow(
            id=workflow_id,
            **workflow.dict(),
            created_at=existing.created_at,
            updated_at=datetime.now()
        )
        self._workflows[workflow_id] = updated_workflow
        return updated_workflow

    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow"""
        if workflow_id in self._workflows:
            del self._workflows[workflow_id]
            # Also delete associated chat messages
            if workflow_id in self._chat_messages:
                del self._chat_messages[workflow_id]
            return True
        return False

    async def export_workflow(self, workflow_id: str, platform: str) -> Optional[Dict[str, Any]]:
        """Export workflow to specific platform format"""
        workflow = self._workflows.get(workflow_id)
        if not workflow:
            return None

        nodes = workflow.nodes
        connections = workflow.connections

        if platform == "zapier":
            trigger_node = next((n for n in nodes if n.type == "trigger"), None)
            action_nodes = [n for n in nodes if n.type == "action"]
            
            return {
                "trigger": {
                    "app": trigger_node.app if trigger_node else "",
                    "event": trigger_node.action if trigger_node else ""
                },
                "actions": [{"app": n.app, "action": n.action} for n in action_nodes]
            }
        
        elif platform == "make":
            return {
                "scenario": {
                    "name": workflow.name,
                    "modules": [{"service": n.app, "operation": n.action} for n in nodes]
                }
            }
        
        elif platform == "n8n":
            return {
                "name": workflow.name,
                "nodes": [{"type": n.app, "name": f"{n.app}_{n.action}"} for n in nodes],
                "connections": {conn.source: [{"node": conn.target}] for conn in connections}
            }
        
        return {"nodes": [n.dict() for n in nodes], "connections": [c.dict() for c in connections]}

    # Chat message methods
    async def get_chat_messages(self, workflow_id: str) -> List[ChatMessage]:
        """Get all chat messages for a workflow"""
        return self._chat_messages.get(workflow_id, [])

    async def create_chat_message(self, message: ChatMessageCreate) -> ChatMessage:
        """Create a new chat message"""
        new_message = ChatMessage(
            id=str(uuid4()),
            **message.dict(),
            timestamp=datetime.now()
        )
        
        workflow_id = message.workflow_id or "default"
        if workflow_id not in self._chat_messages:
            self._chat_messages[workflow_id] = []
        
        self._chat_messages[workflow_id].append(new_message)
        return new_message

    async def delete_chat_message(self, message_id: str) -> bool:
        """Delete a chat message"""
        for workflow_id, messages in self._chat_messages.items():
            for i, message in enumerate(messages):
                if message.id == message_id:
                    del messages[i]
                    return True
        return False

    # Template methods
    async def get_templates(self) -> List[Template]:
        """Get all templates"""
        return self._templates

    async def get_template(self, template_id: str) -> Optional[Template]:
        """Get a template by ID"""
        return next((t for t in self._templates if t.id == template_id), None)

    def _get_default_templates(self) -> List[Template]:
        """Get default workflow templates"""
        return [
            Template(
                id="lead-magnet",
                name="Lead Magnet Automation",
                description="Form → Email → CRM",
                category="Marketing",
                apps=["google-forms", "mailchimp", "hubspot"],
                complexity="Beginner",
                nodes=[
                    WorkflowNode(
                        id="trigger-form",
                        type="trigger",
                        app="google-forms",
                        action="New Response",
                        position={"x": 100, "y": 100}
                    ),
                    WorkflowNode(
                        id="action-email",
                        type="action",
                        app="mailchimp",
                        action="Add Subscriber",
                        position={"x": 400, "y": 100}
                    ),
                    WorkflowNode(
                        id="action-crm",
                        type="action",
                        app="hubspot",
                        action="Create Contact",
                        position={"x": 700, "y": 100}
                    )
                ],
                connections=[
                    WorkflowConnection(source="trigger-form", target="action-email"),
                    WorkflowConnection(source="action-email", target="action-crm")
                ]
            ),
            Template(
                id="support-ticket",
                name="Support Ticket Router",
                description="Email → Slack → Helpdesk",
                category="Productivity",
                apps=["gmail", "slack", "zendesk"],
                complexity="Advanced",
                nodes=[
                    WorkflowNode(
                        id="trigger-email",
                        type="trigger",
                        app="gmail",
                        action="New Email",
                        position={"x": 100, "y": 100}
                    ),
                    WorkflowNode(
                        id="action-slack",
                        type="action",
                        app="slack",
                        action="Send Message",
                        position={"x": 400, "y": 100}
                    ),
                    WorkflowNode(
                        id="action-ticket",
                        type="action",
                        app="zendesk",
                        action="Create Ticket",
                        position={"x": 700, "y": 100}
                    )
                ],
                connections=[
                    WorkflowConnection(source="trigger-email", target="action-slack"),
                    WorkflowConnection(source="action-slack", target="action-ticket")
                ]
            )
        ]
