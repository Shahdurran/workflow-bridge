from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime
from uuid import uuid4

# Workflow Node Types
class WorkflowNode(BaseModel):
    id: str
    type: Literal['trigger', 'action', 'logic']
    app: str
    action: str
    position: Dict[str, float]  # {"x": float, "y": float}
    data: Optional[Dict[str, Any]] = None

class WorkflowConnection(BaseModel):
    source: str
    target: str

# Base Workflow Models
class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    platform: str  # zapier, make, n8n
    nodes: List[WorkflowNode]
    connections: List[WorkflowConnection]

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(WorkflowBase):
    pass

class Workflow(WorkflowBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True

# Chat Message Models
class ChatMessageBase(BaseModel):
    role: Literal['user', 'assistant']
    content: str

class ChatMessageCreate(ChatMessageBase):
    workflow_id: Optional[str] = None

class ChatMessage(ChatMessageBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    workflow_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True

# Template Models
class Template(BaseModel):
    id: str
    name: str
    description: str
    category: Literal['Marketing', 'Sales', 'Productivity', 'E-commerce']
    apps: List[str]
    nodes: List[WorkflowNode]
    connections: List[WorkflowConnection]
    complexity: Literal['Beginner', 'Advanced']

    class Config:
        from_attributes = True

# Platform Export Models
class ZapierExport(BaseModel):
    trigger: Dict[str, Any]
    actions: List[Dict[str, Any]]

class MakeExport(BaseModel):
    scenario: Dict[str, Any]

class N8nExport(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    connections: Dict[str, Any]

# Workflow Generation Models
class WorkflowIntent(BaseModel):
    """Model for extracted workflow intent."""
    trigger: Optional[Dict[str, str]] = None
    actions: List[Dict[str, str]] = []
    missing_info: List[str] = []
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    platform_suggestion: Optional[str] = None
    conversation_stage: str = "greeting"

class WorkflowGenerateRequest(BaseModel):
    """Request model for workflow generation."""
    platform: Literal["n8n", "make", "zapier"]
    intent: WorkflowIntent
    parameters: Dict[str, Any] = Field(default_factory=dict)
    workflow_name: Optional[str] = None
    
    @validator("platform")
    def validate_platform(cls, v):
        """Validate platform is supported."""
        supported = ["n8n", "make", "zapier"]
        if v.lower() not in supported:
            raise ValueError(f"Platform must be one of: {supported}")
        return v.lower()

class WorkflowGenerationResponse(BaseModel):
    """Response model for workflow generation."""
    success: bool
    workflow: Dict[str, Any]
    platform: str
    workflow_name: str
    validation_status: str = "valid"
    warnings: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    message: str = "Workflow generated successfully"

class WorkflowValidationRequest(BaseModel):
    """Request model for workflow validation."""
    workflow_json: Dict[str, Any]
    platform: Literal["n8n", "make", "zapier"]
    strict: bool = False

class WorkflowValidationResponse(BaseModel):
    """Response model for workflow validation."""
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    platform_specific: Optional[Dict[str, Any]] = None

class WorkflowExportRequest(BaseModel):
    """Request model for workflow export."""
    workflow_id: str
    platform: Literal["n8n", "make", "zapier"]
    format: str = "json"
    include_metadata: bool = True

class WorkflowExportResponse(BaseModel):
    """Response model for workflow export."""
    workflow_id: str
    platform: str
    format: str
    exported_at: datetime = Field(default_factory=datetime.now)
    data: Dict[str, Any]
    download_url: Optional[str] = None

class PlatformCapabilities(BaseModel):
    """Model for platform capabilities and limitations."""
    platform_id: str
    max_nodes: Optional[int] = None
    max_connections: Optional[int] = None
    supports_conditional_logic: bool = False
    supports_loops: bool = False
    supports_error_handling: bool = False
    supported_apps: List[str] = Field(default_factory=list)
    limitations: Dict[str, Any] = Field(default_factory=dict)

class WorkflowTemplate(BaseModel):
    """Model for workflow templates."""
    id: str
    name: str
    description: str
    category: str
    platform: str
    complexity: Literal["Beginner", "Intermediate", "Advanced"]
    tags: List[str] = Field(default_factory=list)
    workflow_json: Dict[str, Any]
    parameters: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class WorkflowGenerationStats(BaseModel):
    """Model for workflow generation statistics."""
    total_generated: int = 0
    platforms: Dict[str, int] = Field(default_factory=dict)
    success_rate: float = 0.0
    average_nodes: float = 0.0
    most_common_apps: List[str] = Field(default_factory=list)
    generation_time_ms: Optional[float] = None

# Database Models
class WorkflowListItem(BaseModel):
    """List item model for workflows."""
    id: str
    name: str
    platform: str
    status: str
    created_at: datetime
    updated_at: datetime
    tags: List[str] = Field(default_factory=list)
    
    class Config:
        from_attributes = True

class WorkflowDetail(BaseModel):
    """Detailed workflow model with full data."""
    id: str
    name: str
    description: Optional[str] = None
    platform: str
    workflow_json: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True

class WorkflowUpdateRequest(BaseModel):
    """Request model for updating workflows."""
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_json: Optional[Dict[str, Any]] = None
    status: Optional[Literal["draft", "active", "archived"]] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class WorkflowResponse(BaseModel):
    """Response model for workflow operations."""
    success: bool
    workflow: Dict[str, Any]
    message: str
    validation_warnings: List[str] = Field(default_factory=list)

class ConversationHistory(BaseModel):
    """Model for conversation history."""
    id: str
    session_id: str
    messages: List[Dict[str, Any]]
    workflow_id: Optional[str] = None
    platform: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True

class ConversationMessage(BaseModel):
    """Model for individual conversation message."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str

class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    message: str
    session_id: str
    platform: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)

class ChatMessageResponse(BaseModel):
    """Response model for chat messages."""
    message: str
    session_id: str
    next_action: Optional[str] = None
    workflow_preview: Optional[Dict[str, Any]] = None
    suggestions: List[str] = Field(default_factory=list)

class TemplateListItem(BaseModel):
    """List item model for templates."""
    id: str
    name: str
    description: Optional[str] = None
    platform: str
    trigger_type: str
    action_types: List[str]
    usage_count: int
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    
    class Config:
        from_attributes = True

class DatabaseStats(BaseModel):
    """Model for database statistics."""
    workflows_count: int
    conversations_count: int
    templates_count: int
    timestamp: str
