"""
Translation API Routes
Endpoints for workflow translation and platform migration
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import logging

from app.services.translator_client import WorkflowTranslatorClient
from app.services.make_mcp_client import MakeMcpClient
from app.services.n8n_mcp_client import N8nMcpClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/translation", tags=["translation"])

# Dependency injection
def get_translator_client() -> WorkflowTranslatorClient:
    return WorkflowTranslatorClient()

def get_make_client() -> MakeMcpClient:
    return MakeMcpClient()

def get_n8n_client() -> N8nMcpClient:
    return N8nMcpClient()


# Request/Response Models
class TranslateWorkflowRequest(BaseModel):
    workflow: Dict[str, Any] = Field(..., description="Workflow JSON to translate")
    source_platform: str = Field(..., description="Source platform (n8n, make, zapier)")
    target_platform: str = Field(..., description="Target platform (n8n, make, zapier)")
    optimize: bool = Field(True, description="Apply platform-specific optimizations")
    preserve_names: bool = Field(False, description="Preserve original names")
    strict_mode: bool = Field(False, description="Fail on any issues")
    validate_result: bool = Field(True, description="Validate translated workflow")


class TranslateWorkflowResponse(BaseModel):
    success: bool
    translated_workflow: Dict[str, Any]
    source_platform: str
    target_platform: str
    warnings: List[str]
    errors: List[str]
    metadata: Dict[str, Any]
    validation: Optional[Dict[str, Any]] = None


class FeasibilityCheckRequest(BaseModel):
    workflow: Dict[str, Any] = Field(..., description="Workflow to analyze")
    source_platform: str = Field(..., description="Source platform")
    target_platform: str = Field(..., description="Target platform")


class FeasibilityCheckResponse(BaseModel):
    success: bool
    feasible: bool
    score: float = Field(..., description="Feasibility score (0-100)")
    issues: List[Dict[str, Any]]
    suggestions: List[str]
    translation_path: str


class PlatformRecommendationRequest(BaseModel):
    needs_custom_code: bool = False
    needs_loops: bool = False
    needs_complex_logic: bool = False
    team_technical_level: str = Field("intermediate", description="beginner, intermediate, or advanced")
    self_hosting_preferred: bool = False
    budget_level: str = Field("medium", description="low, medium, or high")


class PlatformRecommendationResponse(BaseModel):
    success: bool
    recommended_platform: str
    scores: List[Dict[str, Any]]
    reasoning: str


class TranslationComplexityResponse(BaseModel):
    success: bool
    translation_path: str
    difficulty: str
    success_rate: float
    common_issues: List[str]


# Endpoints
@router.post("/translate", response_model=TranslateWorkflowResponse)
async def translate_workflow(
    request: TranslateWorkflowRequest,
    translator: WorkflowTranslatorClient = Depends(get_translator_client),
    make_client: MakeMcpClient = Depends(get_make_client),
    n8n_client: N8nMcpClient = Depends(get_n8n_client)
):
    """
    Translate a workflow from one platform to another
    
    Supports: n8n ↔ Make ↔ Zapier
    
    Example:
    ```json
    {
      "workflow": {...},
      "source_platform": "n8n",
      "target_platform": "make",
      "optimize": true,
      "validate_result": true
    }
    ```
    """
    try:
        # Perform translation
        result = await translator.translate_workflow(
            workflow=request.workflow,
            source_platform=request.source_platform,
            target_platform=request.target_platform,
            optimize=request.optimize,
            preserve_names=request.preserve_names,
            strict_mode=request.strict_mode
        )
        
        # Validate translated workflow if requested
        validation_result = None
        if request.validate_result and result.get("success"):
            try:
                if request.target_platform == "make":
                    validation_result = await make_client.validate_make_scenario(
                        scenario=result["translated_workflow"],
                        profile="balanced"
                    )
                elif request.target_platform == "n8n":
                    validation_result = await n8n_client.validate_workflow(
                        workflow=result["translated_workflow"]
                    )
            except Exception as e:
                logger.warning(f"Validation failed: {e}")
                validation_result = {"error": str(e)}
        
        return TranslateWorkflowResponse(
            success=result.get("success", False),
            translated_workflow=result.get("translated_workflow", {}),
            source_platform=result.get("source_platform", request.source_platform),
            target_platform=result.get("target_platform", request.target_platform),
            warnings=result.get("warnings", []),
            errors=result.get("errors", []),
            metadata=result.get("metadata", {}),
            validation=validation_result
        )
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
    finally:
        await translator.close()
        await make_client.close()
        await n8n_client.close()


@router.post("/feasibility", response_model=FeasibilityCheckResponse)
async def check_feasibility(
    request: FeasibilityCheckRequest,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Check if a workflow can be successfully translated to target platform
    
    Returns feasibility score and list of potential issues
    
    Example:
    ```json
    {
      "workflow": {...},
      "source_platform": "n8n",
      "target_platform": "zapier"
    }
    ```
    """
    try:
        result = await translator.check_translation_feasibility(
            workflow=request.workflow,
            source_platform=request.source_platform,
            target_platform=request.target_platform
        )
        
        feasibility = result.get("feasibility", {})
        
        return FeasibilityCheckResponse(
            success=result.get("success", False),
            feasible=feasibility.get("feasible", False),
            score=feasibility.get("score", 0.0),
            issues=feasibility.get("issues", []),
            suggestions=feasibility.get("suggestions", []),
            translation_path=feasibility.get("translation_path", f"{request.source_platform} → {request.target_platform}")
        )
        
    except Exception as e:
        logger.error(f"Feasibility check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Feasibility check failed: {str(e)}")
    finally:
        await translator.close()


@router.get("/platforms/capabilities")
async def get_platform_capabilities(
    platforms: Optional[str] = None,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Get capabilities comparison for automation platforms
    
    Query params:
    - platforms: Comma-separated list (e.g., "n8n,make,zapier")
    
    Returns feature matrix and limitations for each platform
    """
    try:
        platform_list = platforms.split(",") if platforms else None
        
        result = await translator.get_platform_capabilities(
            platforms=platform_list
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get platform capabilities: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.get("/complexity/{source_platform}/{target_platform}", response_model=TranslationComplexityResponse)
async def get_translation_complexity(
    source_platform: str,
    target_platform: str,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Get difficulty and success rate for a specific translation path
    
    Path params:
    - source_platform: n8n, make, or zapier
    - target_platform: n8n, make, or zapier
    
    Example: /api/translation/complexity/n8n/zapier
    """
    try:
        result = await translator.get_translation_complexity(
            source_platform=source_platform,
            target_platform=target_platform
        )
        
        return TranslationComplexityResponse(
            success=result.get("success", False),
            translation_path=result.get("translation_path", f"{source_platform} → {target_platform}"),
            difficulty=result.get("difficulty", "unknown"),
            success_rate=result.get("success_rate", 0.0),
            common_issues=result.get("common_issues", [])
        )
        
    except Exception as e:
        logger.error(f"Failed to get translation complexity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.post("/recommend-platform", response_model=PlatformRecommendationResponse)
async def recommend_platform(
    request: PlatformRecommendationRequest,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Get platform recommendation based on requirements
    
    Example:
    ```json
    {
      "needs_custom_code": true,
      "needs_loops": true,
      "needs_complex_logic": true,
      "team_technical_level": "advanced",
      "self_hosting_preferred": true,
      "budget_level": "low"
    }
    ```
    
    Will recommend n8n for the above requirements
    """
    try:
        requirements = {
            "needs_custom_code": request.needs_custom_code,
            "needs_loops": request.needs_loops,
            "needs_complex_logic": request.needs_complex_logic,
            "team_technical_level": request.team_technical_level,
            "self_hosting_preferred": request.self_hosting_preferred,
            "budget_level": request.budget_level
        }
        
        result = await translator.suggest_best_platform(requirements=requirements)
        
        return PlatformRecommendationResponse(
            success=result.get("success", False),
            recommended_platform=result.get("recommended_platform", "unknown"),
            scores=result.get("scores", []),
            reasoning=result.get("reasoning", "")
        )
        
    except Exception as e:
        logger.error(f"Platform recommendation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.post("/translate-expression")
async def translate_expression(
    expression: str,
    source_platform: str,
    target_platform: str,
    context: Optional[Dict[str, Any]] = None,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Translate a single expression between platform syntaxes
    
    Query params:
    - expression: Expression to translate (e.g., "{{$json.email}}")
    - source_platform: Source platform
    - target_platform: Target platform
    - context: Optional context JSON
    
    Example: POST /api/translation/translate-expression?expression={{$json.email}}&source_platform=n8n&target_platform=make
    """
    try:
        result = await translator.translate_expression(
            expression=expression,
            source_platform=source_platform,
            target_platform=target_platform,
            context=context
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Expression translation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.post("/analyze-complexity")
async def analyze_workflow_complexity(
    workflow: Dict[str, Any],
    platform: str,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Analyze workflow complexity and get optimization suggestions
    
    Body:
    ```json
    {
      "workflow": {...},
      "platform": "n8n"
    }
    ```
    
    Returns complexity score and actionable suggestions
    """
    try:
        result = await translator.analyze_workflow_complexity(
            workflow=workflow,
            platform=platform
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Complexity analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.post("/batch-translate")
async def batch_translate_workflows(
    workflows: List[Dict[str, Any]],
    source_platform: str,
    target_platform: str,
    optimize: bool = True,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Translate multiple workflows at once
    
    Body:
    ```json
    {
      "workflows": [{...}, {...}, {...}],
      "source_platform": "n8n",
      "target_platform": "make",
      "optimize": true
    }
    ```
    
    Returns batch translation results with success/failure for each
    """
    try:
        result = await translator.batch_translate_workflows(
            workflows=workflows,
            source_platform=source_platform,
            target_platform=target_platform,
            optimize=optimize
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Batch translation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await translator.close()


@router.get("/health")
async def health_check(
    translator: WorkflowTranslatorClient = Depends(get_translator_client),
    make_client: MakeMcpClient = Depends(get_make_client),
    n8n_client: N8nMcpClient = Depends(get_n8n_client)
):
    """
    Check health of all translation services
    
    Returns status of:
    - Workflow Translator
    - Make-MCP
    - n8n-MCP
    """
    try:
        translator_health = await translator.health_check()
        make_health = await make_client.health_check()
        n8n_health = await n8n_client.health_check()
        
        all_healthy = (
            translator_health.get("status") == "healthy" and
            make_health.get("status") == "healthy" and
            n8n_health.get("status") == "healthy"
        )
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "services": {
                "workflow_translator": translator_health,
                "make_mcp": make_health,
                "n8n_mcp": n8n_health
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
    finally:
        await translator.close()
        await make_client.close()
        await n8n_client.close()

