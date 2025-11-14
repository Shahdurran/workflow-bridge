"""
AI Service for processing user conversations and extracting workflow intents.
Uses OpenAI GPT-4 and LangChain for conversation management.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import tiktoken

from app.core.config import get_settings
from app.core.prompts import (
    INTENT_EXTRACTION_PROMPT,
    CLARIFICATION_PROMPT,
    WORKFLOW_GENERATION_PROMPT,
    WORKFLOW_NAME_SUGGESTION_PROMPT,
    CONVERSATION_RESPONSE_PROMPT,
    ERROR_HANDLING_PROMPT,
    PLATFORM_RECOMMENDATION_PROMPT
)
from app.models.schema import ChatMessage, ChatMessageCreate
from app.services.supabase_client import get_supabase_client

# Configure logging
logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Custom exception for AI service errors."""
    pass

class ConversationResponse:
    """Response object for conversation processing."""
    
    def __init__(
        self,
        message: str,
        intent: Optional[Dict] = None,
        clarifying_questions: Optional[List[str]] = None,
        workflow_ready: bool = False,
        suggested_name: Optional[str] = None,
        platform_recommendation: Optional[str] = None,
        confidence: float = 0.0,
        conversation_stage: str = "greeting",
        metadata: Optional[Dict] = None,
        interaction_id: Optional[str] = None
    ):
        self.message = message
        self.intent = intent or {}
        self.clarifying_questions = clarifying_questions or []
        self.workflow_ready = workflow_ready
        self.suggested_name = suggested_name
        self.platform_recommendation = platform_recommendation
        self.confidence = confidence
        self.conversation_stage = conversation_stage
        self.metadata = metadata or {}
        self.interaction_id = interaction_id

class AIService:
    """
    AI Service for processing user conversations and extracting workflow intents.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.llm = self._initialize_llm()
        self.memory = ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history"
        )
        self.encoding = tiktoken.encoding_for_model(self.settings.openai_model)
        self.total_tokens_used = 0
        
        # Initialize data collector for training data collection
        self.data_collector = None
        if self.settings.enable_data_collection:
            try:
                from app.services.data_collector import DataCollector
                supabase_client = get_supabase_client()
                self.data_collector = DataCollector(supabase_client)
                logger.info("DataCollector initialized for training data collection")
            except Exception as e:
                logger.warning(f"Failed to initialize DataCollector: {e}")
        
        logger.info("AI Service initialized with model: %s", self.settings.openai_model)
    
    def _initialize_llm(self) -> ChatOpenAI:
        """Initialize the ChatOpenAI instance with configuration."""
        try:
            return ChatOpenAI(
                model=self.settings.openai_model,
                temperature=self.settings.openai_temperature,
                max_tokens=self.settings.openai_max_tokens,
                openai_api_key=self.settings.openai_api_key,
                verbose=self.settings.langchain_verbose
            )
        except Exception as e:
            logger.error("Failed to initialize OpenAI client: %s", str(e))
            raise AIServiceError(f"Failed to initialize AI service: {str(e)}")
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in a text string."""
        try:
            return len(self.encoding.encode(text))
        except Exception:
            # Fallback to rough estimation
            return len(text.split()) * 1.3
    
    def _track_token_usage(self, prompt: str, response: str) -> None:
        """Track token usage for cost monitoring."""
        prompt_tokens = self._count_tokens(prompt)
        response_tokens = self._count_tokens(response)
        total_tokens = prompt_tokens + response_tokens
        self.total_tokens_used += total_tokens
        
        logger.info(
            "Token usage - Prompt: %d, Response: %d, Total: %d, Session Total: %d",
            prompt_tokens, response_tokens, total_tokens, self.total_tokens_used
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((Exception,))
    )
    async def _call_llm_with_retry(self, prompt: str) -> str:
        """Call LLM with retry logic for rate limits and failures."""
        try:
            messages = [HumanMessage(content=prompt)]
            response = await self.llm.ainvoke(messages)
            
            response_text = response.content
            self._track_token_usage(prompt, response_text)
            
            return response_text
            
        except Exception as e:
            error_msg = str(e)
            logger.error("LLM call failed: %s", error_msg)
            
            # Handle specific OpenAI errors
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                raise AIServiceError("Rate limit exceeded. Please try again in a moment.")
            elif "invalid_api_key" in error_msg.lower() or "401" in error_msg:
                raise AIServiceError("API authentication failed.")
            elif "token" in error_msg.lower() and "limit" in error_msg.lower():
                raise AIServiceError("Message too long. Please try a shorter request.")
            else:
                raise AIServiceError(f"AI service temporarily unavailable: {error_msg}")
    
    def _parse_json_response(self, response: str) -> Dict:
        """Safely parse JSON response from LLM."""
        try:
            # Clean the response - remove markdown code blocks if present
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            return json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse JSON response: %s\nResponse: %s", str(e), response)
            raise AIServiceError("Failed to parse AI response. Please try again.")
    
    def _format_conversation_history(self, messages: List[ChatMessage]) -> str:
        """Format conversation history for prompts."""
        if not messages:
            return "No previous conversation."
        
        formatted = []
        for msg in messages[-5:]:  # Keep last 5 messages for context
            role = "User" if msg.role == "user" else "Assistant"
            formatted.append(f"{role}: {msg.content}")
        
        return "\n".join(formatted)
    
    async def extract_intent(
        self, 
        user_message: str, 
        conversation_history: Optional[List[ChatMessage]] = None
    ) -> Dict:
        """
        Extract trigger and actions from user message.
        
        Args:
            user_message: The user's input message
            conversation_history: Previous conversation messages for context
            
        Returns:
            Dictionary containing extracted intent information
        """
        try:
            history_text = self._format_conversation_history(conversation_history or [])
            
            prompt = INTENT_EXTRACTION_PROMPT.format(
                user_input=user_message,
                conversation_history=history_text
            )
            
            response = await self._call_llm_with_retry(prompt)
            intent_data = self._parse_json_response(response)
            
            # Validate required fields
            required_fields = ["trigger", "actions", "missing_info", "confidence", "conversation_stage"]
            for field in required_fields:
                if field not in intent_data:
                    intent_data[field] = None if field != "missing_info" else []
            
            logger.info("Extracted intent with confidence: %s", intent_data.get("confidence", 0))
            return intent_data
            
        except Exception as e:
            logger.error("Intent extraction failed: %s", str(e))
            return {
                "trigger": None,
                "actions": [],
                "missing_info": ["Unable to understand request"],
                "confidence": 0.0,
                "conversation_stage": "intent_gathering",
                "error": str(e)
            }
    
    async def generate_clarifying_questions(
        self, 
        intent: Dict, 
        platform: str = "zapier",
        conversation_history: Optional[List[ChatMessage]] = None
    ) -> List[str]:
        """
        Generate follow-up questions based on extracted intent.
        
        Args:
            intent: The extracted intent dictionary
            platform: Target automation platform
            conversation_history: Previous conversation for context
            
        Returns:
            List of clarifying questions
        """
        try:
            missing_info = intent.get("missing_info", [])
            if not missing_info:
                return []
            
            history_text = self._format_conversation_history(conversation_history or [])
            
            prompt = CLARIFICATION_PROMPT.format(
                intent=json.dumps(intent, indent=2),
                missing_info=missing_info,
                platform=platform,
                conversation_history=history_text
            )
            
            response = await self._call_llm_with_retry(prompt)
            questions = self._parse_json_response(response)
            
            # Ensure we return a list
            if isinstance(questions, list):
                return questions[:3]  # Limit to 3 questions
            else:
                return [str(questions)]
                
        except Exception as e:
            logger.error("Question generation failed: %s", str(e))
            return ["Could you provide more details about your automation needs?"]
    
    async def process_conversation(
        self, 
        messages: List[ChatMessage],
        current_message: str,
        user_id: Optional[str] = None,
        platform: Optional[str] = None
    ) -> ConversationResponse:
        """
        Process multi-turn conversation and return appropriate response.
        
        Args:
            messages: List of previous conversation messages
            current_message: The current user message
            user_id: Optional user ID for data collection
            platform: Optional target platform
            
        Returns:
            ConversationResponse object with next steps
        """
        start_time = datetime.utcnow()
        interaction_id = None
        
        try:
            # Extract intent from current message with conversation context
            intent = await self.extract_intent(current_message, messages)
            
            conversation_stage = intent.get("conversation_stage", "greeting")
            confidence = intent.get("confidence", 0.0)
            missing_info = intent.get("missing_info", [])
            
            # Determine if workflow is ready to generate
            workflow_ready = (
                confidence > 0.7 and 
                len(missing_info) == 0 and 
                intent.get("trigger") and 
                intent.get("actions")
            )
            
            # Generate appropriate response based on conversation stage
            response_message = await self._generate_conversation_response(
                current_message, intent, conversation_stage, missing_info
            )
            
            # Generate clarifying questions if needed
            clarifying_questions = []
            if not workflow_ready and missing_info:
                platform_hint = platform or intent.get("platform_suggestion", "zapier")
                clarifying_questions = await self.generate_clarifying_questions(
                    intent, platform_hint, messages
                )
            
            # Suggest workflow name if ready
            suggested_name = None
            if workflow_ready:
                suggested_name = await self.suggest_workflow_name(intent)
            
            # Get platform recommendation
            platform_recommendation = platform or intent.get("platform_suggestion")
            
            # Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Log conversation for training data (only if workflow_ready or has good intent)
            if self.data_collector and platform_recommendation:
                try:
                    interaction_id = await self.data_collector.log_conversation(
                        user_message=current_message,
                        ai_response=response_message,
                        platform=platform_recommendation,
                        user_id=user_id,
                        intent_extracted=json.dumps(intent),
                        workflow_generated=None,  # Will be added when workflow is generated
                        success=True,
                        processing_time_ms=processing_time_ms,
                        model_version=self.settings.openai_model,
                    )
                except Exception as e:
                    logger.error(f"Failed to log conversation: {e}")
            
            return ConversationResponse(
                message=response_message,
                intent=intent,
                clarifying_questions=clarifying_questions,
                workflow_ready=workflow_ready,
                suggested_name=suggested_name,
                platform_recommendation=platform_recommendation,
                confidence=confidence,
                conversation_stage=conversation_stage,
                interaction_id=interaction_id,
                metadata={
                    "tokens_used": self.total_tokens_used,
                    "timestamp": datetime.utcnow().isoformat(),
                    "processing_time_ms": processing_time_ms,
                }
            )
            
        except Exception as e:
            logger.error("Conversation processing failed: %s", str(e))
            error_response = await self._generate_error_response("api_error", current_message, str(e))
            
            # Log failed interaction for training data
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            if self.data_collector and platform:
                try:
                    interaction_id = await self.data_collector.log_conversation(
                        user_message=current_message,
                        ai_response=error_response,
                        platform=platform,
                        user_id=user_id,
                        success=False,
                        error_message=str(e),
                        processing_time_ms=processing_time_ms,
                        model_version=self.settings.openai_model,
                    )
                except Exception as log_error:
                    logger.error(f"Failed to log failed conversation: {log_error}")
            
            return ConversationResponse(
                message=error_response,
                confidence=0.0,
                conversation_stage="error",
                interaction_id=interaction_id,
                metadata={"error": str(e)}
            )
    
    async def _generate_conversation_response(
        self,
        user_message: str,
        intent: Dict,
        conversation_stage: str,
        missing_info: List[str]
    ) -> str:
        """Generate a conversational response based on the current state."""
        try:
            prompt = CONVERSATION_RESPONSE_PROMPT.format(
                user_message=user_message,
                intent=json.dumps(intent, indent=2),
                conversation_stage=conversation_stage,
                missing_info=missing_info
            )
            
            return await self._call_llm_with_retry(prompt)
            
        except Exception as e:
            logger.error("Response generation failed: %s", str(e))
            return "I understand you want to create an automation. Could you tell me more about what you'd like to automate?"
    
    async def _generate_error_response(
        self,
        error_type: str,
        user_message: str,
        context: str
    ) -> str:
        """Generate a user-friendly error response."""
        try:
            prompt = ERROR_HANDLING_PROMPT.format(
                error_type=error_type,
                user_message=user_message,
                context=context
            )
            
            return await self._call_llm_with_retry(prompt)
            
        except Exception:
            # Fallback error messages
            fallback_messages = {
                "api_error": "I'm having some technical difficulties right now. Please try again in a moment!",
                "rate_limit": "I'm getting a lot of requests right now. Please wait a moment and try again.",
                "unclear_intent": "I'm not quite sure what you want to automate. Could you be more specific?",
                "invalid_workflow": "That workflow combination might not be possible. Let's try a different approach.",
                "missing_info": "I need a few more details to help you build this automation."
            }
            return fallback_messages.get(error_type, "Something went wrong. Please try again!")
    
    async def suggest_workflow_name(self, intent: Dict) -> str:
        """
        Suggest a workflow name based on extracted intent.
        
        Args:
            intent: The extracted intent dictionary
            
        Returns:
            Suggested workflow name
        """
        try:
            trigger = intent.get("trigger", {})
            actions = intent.get("actions", [])
            
            if not trigger or not actions:
                return "My Automation"
            
            prompt = WORKFLOW_NAME_SUGGESTION_PROMPT.format(
                trigger=json.dumps(trigger),
                actions=json.dumps(actions)
            )
            
            response = await self._call_llm_with_retry(prompt)
            return response.strip().strip('"')  # Remove quotes if present
            
        except Exception as e:
            logger.error("Workflow name suggestion failed: %s", str(e))
            # Fallback name generation
            trigger_app = intent.get("trigger", {}).get("app", "Trigger")
            if intent.get("actions"):
                action_app = intent.get("actions")[0].get("app", "Action")
                return f"{trigger_app} to {action_app}"
            return "My Automation"
    
    async def generate_workflow_json(
        self,
        intent: Dict,
        platform: str,
        parameters: Optional[Dict] = None,
        workflow_name: Optional[str] = None,
        user_id: Optional[str] = None,
        user_message: Optional[str] = None,
        interaction_id: Optional[str] = None
    ) -> Dict:
        """
        Generate platform-specific workflow JSON.
        
        Args:
            intent: The extracted intent dictionary
            platform: Target platform (zapier, make, n8n)
            parameters: Additional configuration parameters
            workflow_name: Name for the workflow
            user_id: Optional user ID for data collection
            user_message: Original user message for data collection
            interaction_id: Optional existing interaction ID to update
            
        Returns:
            Platform-specific workflow JSON
        """
        start_time = datetime.utcnow()
        
        try:
            if not workflow_name:
                workflow_name = await self.suggest_workflow_name(intent)
            
            prompt = WORKFLOW_GENERATION_PROMPT.format(
                platform=platform,
                trigger=json.dumps(intent.get("trigger", {})),
                actions=json.dumps(intent.get("actions", [])),
                parameters=json.dumps(parameters or {}),
                workflow_name=workflow_name
            )
            
            response = await self._call_llm_with_retry(prompt)
            workflow_json = self._parse_json_response(response)
            
            # Add metadata
            workflow_json["metadata"] = {
                "created_by": "WorkflowBridge",
                "created_at": datetime.utcnow().isoformat(),
                "platform": platform,
                "confidence": intent.get("confidence", 0.0)
            }
            
            # Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Log workflow generation for training data
            if self.data_collector and user_message:
                try:
                    logged_id = await self.data_collector.log_conversation(
                        user_message=user_message,
                        ai_response=json.dumps(workflow_json),
                        platform=platform,
                        user_id=user_id,
                        intent_extracted=json.dumps(intent),
                        workflow_generated=workflow_json,
                        success=True,
                        processing_time_ms=processing_time_ms,
                        model_version=self.settings.openai_model,
                    )
                    
                    # Store the interaction_id in metadata for feedback
                    if logged_id:
                        workflow_json["metadata"]["interaction_id"] = logged_id
                        
                except Exception as e:
                    logger.error(f"Failed to log workflow generation: {e}")
            
            return workflow_json
            
        except Exception as e:
            logger.error("Workflow JSON generation failed: %s", str(e))
            
            # Log failed workflow generation
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            if self.data_collector and user_message:
                try:
                    await self.data_collector.log_conversation(
                        user_message=user_message,
                        ai_response="Failed to generate workflow",
                        platform=platform,
                        user_id=user_id,
                        intent_extracted=json.dumps(intent),
                        success=False,
                        error_message=str(e),
                        processing_time_ms=processing_time_ms,
                        model_version=self.settings.openai_model,
                    )
                except Exception as log_error:
                    logger.error(f"Failed to log failed workflow generation: {log_error}")
            
            raise AIServiceError(f"Failed to generate workflow: {str(e)}")
    
    async def recommend_platform(
        self,
        workflow_complexity: str,
        user_experience: str,
        apps_involved: List[str]
    ) -> Dict:
        """
        Recommend the best platform for a workflow.
        
        Args:
            workflow_complexity: "simple", "medium", "complex"
            user_experience: "beginner", "intermediate", "advanced"
            apps_involved: List of app names in the workflow
            
        Returns:
            Platform recommendation with reasoning
        """
        try:
            prompt = PLATFORM_RECOMMENDATION_PROMPT.format(
                workflow_complexity=workflow_complexity,
                user_experience=user_experience,
                apps_involved=json.dumps(apps_involved)
            )
            
            response = await self._call_llm_with_retry(prompt)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error("Platform recommendation failed: %s", str(e))
            # Fallback recommendation
            return {
                "recommended_platform": "zapier",
                "reason": "Zapier is great for most automation needs",
                "confidence": 0.5,
                "alternatives": ["make", "n8n"]
            }
    
    def get_token_usage_stats(self) -> Dict:
        """Get current token usage statistics."""
        return {
            "total_tokens_used": self.total_tokens_used,
            "estimated_cost_usd": self.total_tokens_used * 0.00003,  # Rough GPT-4 estimate
            "model": self.settings.openai_model
        }
    
    def reset_conversation(self) -> None:
        """Reset conversation memory and token counter."""
        self.memory.clear()
        self.total_tokens_used = 0
        logger.info("Conversation memory and token counter reset")


# Example usage (for documentation):
"""
# Initialize AI service
ai_service = AIService()

# Process a simple conversation
messages = []
current_message = "Send me an email when someone fills out my contact form"

response = await ai_service.process_conversation(messages, current_message)

print(f"AI Response: {response.message}")
print(f"Workflow Ready: {response.workflow_ready}")
print(f"Confidence: {response.confidence}")

if response.clarifying_questions:
    print("Clarifying Questions:")
    for q in response.clarifying_questions:
        print(f"- {q}")

# Generate workflow JSON when ready
if response.workflow_ready:
    workflow_json = await ai_service.generate_workflow_json(
        response.intent,
        response.platform_recommendation or "zapier",
        workflow_name=response.suggested_name
    )
    print("Generated Workflow:", json.dumps(workflow_json, indent=2))
"""