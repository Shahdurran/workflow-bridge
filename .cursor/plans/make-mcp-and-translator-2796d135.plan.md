<!-- 2796d135-5a10-4145-b62d-d9aa30d2958d 6daddfd5-ac1b-4a95-944f-65f384c3cb73 -->
# Make-MCP & Universal Translator Agent - Execution Plan

## Overview

Build a functional Make.com MCP server and Universal Translator agent for multi-platform workflow automation. Target: 4-6 weeks MVP with ~100 popular Make modules, bidirectional translation with optimization, deployed as separate microservices.

## Phase 1: Make-MCP Foundation (Weeks 1-2)

### Week 1: Project Setup & Data Structure

**1.1 Create make-mcp Repository Structure**

```
make-mcp/
├── src/
│   ├── database/
│   │   ├── make-modules.db          # SQLite for Make modules
│   │   ├── schema.sql                # Database schema
│   │   └── module-repository.ts      # Data access layer
│   ├── scrapers/
│   │   ├── make-docs-scraper.ts     # Scrape Make docs
│   │   └── module-parser.ts          # Parse module definitions
│   ├── services/
│   │   ├── make-validator.ts        # Validate Make scenarios
│   │   └── module-search.ts         # Search & filter modules
│   ├── mcp/
│   │   ├── server.ts                # MCP server implementation
│   │   └── tools-make.ts            # MCP tool definitions
│   └── index.ts                     # Entry point
├── data/
│   └── priority-modules.json        # List of 100 priority modules
├── package.json
├── tsconfig.json
└── Dockerfile
```

**1.2 Database Schema Design**

Create schema matching n8n-mcp structure but for Make:

```sql
CREATE TABLE make_modules (
    id INTEGER PRIMARY KEY,
    module_name TEXT NOT NULL,
    module_type TEXT NOT NULL,  -- 'trigger', 'action', 'search'
    app_name TEXT NOT NULL,
    description TEXT,
    documentation TEXT,
    parameters JSON,
    examples JSON,
    category TEXT,
    popularity_score INTEGER DEFAULT 0
);

CREATE TABLE make_templates (
    id INTEGER PRIMARY KEY,
    template_id TEXT UNIQUE,
    name TEXT,
    description TEXT,
    modules JSON,
    metadata JSON
);
```

**1.3 Define Priority Modules**

Create `data/priority-modules.json` with 100 most popular Make apps:

- HTTP/Webhook modules (universal)
- Google Workspace (Sheets, Drive, Gmail, Calendar)
- Microsoft 365 (Excel, Outlook, Teams)
- Slack, Discord
- Airtable, Notion
- Email (SMTP, IMAP)
- CRM (HubSpot, Salesforce)
- E-commerce (Shopify, WooCommerce)
- Social Media (Twitter, Facebook, LinkedIn)
- Developer tools (GitHub, GitLab)

### Week 2: Data Collection & MCP Tools

**2.1 Build Documentation Scraper**

Based on n8n-mcp's approach, create scraper for Make.com docs:

```typescript
// src/scrapers/make-docs-scraper.ts
class MakeDocsScraper {
    async scrapeModule(moduleName: string) {
        // 1. Fetch from https://www.make.com/en/help/app/[app-name]
        // 2. Extract module parameters, types, descriptions
        // 3. Parse examples if available
        // 4. Return structured data
    }
    
    async scrapePriorityModules() {
        // Iterate through priority-modules.json
        // Rate limit: 1 request per 2 seconds
        // Store in SQLite as we go
    }
}
```

**2.2 Implement Core MCP Tools**

```typescript
// src/mcp/tools-make.ts
const MAKE_TOOLS = [
    {
        name: "search_make_modules",
        description: "Search Make.com modules by name or functionality",
        inputSchema: { query: "string", limit: "number" }
    },
    {
        name: "get_module_essentials",
        description: "Get detailed information about a Make module",
        inputSchema: { moduleName: "string", includeExamples: "boolean" }
    },
    {
        name: "validate_make_scenario",
        description: "Validate a Make scenario JSON structure",
        inputSchema: { scenario: "object", profile: "string" }
    },
    {
        name: "list_make_templates",
        description: "List available Make scenario templates",
        inputSchema: { category: "string", limit: "number" }
    }
];
```

**2.3 Build Validation Service**

```typescript
// src/services/make-validator.ts
class MakeValidator {
    validateScenario(scenario: any): ValidationResult {
        // 1. Check required fields: name, flow, metadata
        // 2. Validate each module in flow
        // 3. Check module connections (sequential IDs)
        // 4. Verify parameters against module schemas
        // 5. Return errors/warnings
    }
    
    autoFixScenario(scenario: any, errors: ValidationError[]): any {
        // Similar to n8n-mcp's autofix
        // Fix common issues automatically
    }
}
```

## Phase 2: Universal Translator Agent (Weeks 3-4)

### Week 3: Translator Architecture

**3.1 Create Translator Service Structure**

```
workflow-translator/
├── src/
│   ├── translators/
│   │   ├── n8n-to-make.ts
│   │   ├── make-to-n8n.ts
│   │   ├── n8n-to-zapier.ts
│   │   ├── zapier-to-n8n.ts
│   │   ├── make-to-zapier.ts
│   │   └── zapier-to-make.ts
│   ├── optimizers/
│   │   ├── platform-optimizer.ts     # Optimize for target platform
│   │   └── capability-mapper.ts      # Map features across platforms
│   ├── services/
│   │   ├── translation-engine.ts     # Core translation logic
│   │   ├── schema-mapper.ts          # Map schemas between platforms
│   │   └── ai-service.ts             # Claude integration for complex mappings
│   ├── mcp/
│   │   ├── server.ts
│   │   └── tools-translator.ts
│   └── index.ts
├── data/
│   ├── mapping-rules.json            # Manual mapping rules
│   └── platform-capabilities.json    # Platform feature matrix
└── package.json
```

**3.2 Define Translation Rules**

Create comprehensive mapping between platforms:

```typescript
// data/mapping-rules.json structure
{
    "triggers": {
        "webhook": {
            "n8n": "n8n-nodes-base.webhook",
            "make": "gateway:WebhookRespond",
            "zapier": "webhooks"
        },
        "schedule": {
            "n8n": "n8n-nodes-base.scheduleTrigger",
            "make": "gateway:ScheduleTrigger",
            "zapier": "schedule"
        }
        // ... 50+ common trigger mappings
    },
    "actions": {
        "http_request": {
            "n8n": "n8n-nodes-base.httpRequest",
            "make": "http:ActionSendData",
            "zapier": "webhooks.post"
        }
        // ... 200+ common action mappings
    }
}
```

**3.3 Build Core Translation Engine**

```typescript
// src/services/translation-engine.ts
class TranslationEngine {
    async translate(
        workflow: any,
        sourcePlatform: Platform,
        targetPlatform: Platform,
        options: { optimize: boolean }
    ): Promise<TranslationResult> {
        // 1. Parse source workflow structure
        // 2. Extract nodes/modules/steps
        // 3. Map each component using mapping-rules.json
        // 4. Handle platform-specific features
        // 5. Apply optimizations if requested
        // 6. Validate target workflow
        // 7. Return translated workflow + warnings
    }
    
    async optimizeForPlatform(workflow: any, platform: Platform): Promise<any> {
        // Apply platform-specific optimizations:
        // - Combine multiple steps into one if possible
        // - Use platform-native features
        // - Improve error handling based on platform
    }
}
```

### Week 4: AI-Enhanced Translation & Optimization

**4.1 Implement AI Fallback for Complex Mappings**

```typescript
// src/services/ai-service.ts
class AITranslationService {
    async translateComplexNode(
        sourceNode: any,
        sourcePlatform: string,
        targetPlatform: string,
        context: TranslationContext
    ): Promise<any> {
        // Use Claude API for:
        // 1. Unmapped node types
        // 2. Complex parameter transformations
        // 3. Custom code nodes
        // 4. Platform-specific logic
        
        const prompt = `
        Translate this ${sourcePlatform} node to ${targetPlatform}:
        Source: ${JSON.stringify(sourceNode)}
        
        Available ${targetPlatform} modules:
        ${context.availableModules}
        
        Return valid ${targetPlatform} JSON structure.
        `;
        
        return await this.callClaude(prompt);
    }
}
```

**4.2 Build Optimization Layer**

```typescript
// src/optimizers/platform-optimizer.ts
class PlatformOptimizer {
    optimizeForN8n(workflow: any): any {
        // - Use built-in nodes instead of HTTP where possible
        // - Add error handling workflows
        // - Leverage n8n expressions
    }
    
    optimizeForMake(scenario: any): any {
        // - Use Make's routers for conditional logic
        // - Leverage Make's data store for state
        // - Apply Make's error handlers
    }
    
    optimizeForZapier(zap: any): any {
        // - Simplify to linear flow (Zapier limitation)
        // - Use Zapier filters for conditions
        // - Apply Zapier formatter when needed
    }
}
```

**4.3 Define MCP Tools for Translator**

```typescript
// src/mcp/tools-translator.ts
const TRANSLATOR_TOOLS = [
    {
        name: "translate_workflow",
        description: "Translate workflow from one platform to another",
        inputSchema: {
            workflow: "object",
            sourcePlatform: "enum[n8n,make,zapier]",
            targetPlatform: "enum[n8n,make,zapier]",
            optimize: "boolean"
        }
    },
    {
        name: "check_translation_feasibility",
        description: "Check if workflow can be translated to target platform",
        inputSchema: {
            workflow: "object",
            sourcePlatform: "string",
            targetPlatform: "string"
        }
    },
    {
        name: "get_platform_capabilities",
        description: "Get feature comparison between platforms",
        inputSchema: {
            platforms: "array"
        }
    }
];
```

## Phase 3: Integration & Testing (Week 5)

### Week 5: Backend Integration

**5.1 Update Python Backend to Use Make-MCP**

```python
# app/services/make_mcp_client.py (new file)
class MakeMcpClient:
    """Client for make-mcp server"""
    
    def __init__(self, base_url: str = "http://localhost:3002"):
        self.base_url = base_url
        self.mcp_endpoint = f"{base_url}/mcp"
    
    async def search_modules(self, query: str) -> Dict:
        return await self._call_tool("search_make_modules", {"query": query})
    
    async def get_module_essentials(self, module_name: str) -> Dict:
        return await self._call_tool("get_module_essentials", {
            "moduleName": module_name,
            "includeExamples": True
        })
    
    async def validate_scenario(self, scenario: Dict) -> Dict:
        return await self._call_tool("validate_make_scenario", {"scenario": scenario})
```

**5.2 Update Workflow Generator to Use Make-MCP**

```python
# app/services/workflow_generator.py - enhance existing
async def generate_make_workflow(self, intent: Dict, parameters: Dict) -> Dict:
    """Enhanced Make workflow generation with MCP"""
    
    # 1. Search for appropriate Make modules using MCP
    trigger_modules = await make_mcp_client.search_modules(
        query=intent.get("trigger", {}).get("app", "")
    )
    
    # 2. Get detailed module information
    module_docs = await make_mcp_client.get_module_essentials(
        module_name=trigger_modules[0]["name"]
    )
    
    # 3. Generate scenario using real module schemas
    scenario = self._build_make_scenario(intent, parameters, module_docs)
    
    # 4. Validate scenario
    validation = await make_mcp_client.validate_scenario(scenario)
    
    # 5. Auto-fix if needed
    if not validation["valid"]:
        scenario = self._apply_fixes(scenario, validation["errors"])
    
    return scenario
```

**5.3 Add Translator Service Client**

```python
# app/services/translator_client.py (new file)
class WorkflowTranslatorClient:
    """Client for workflow-translator service"""
    
    def __init__(self, base_url: str = "http://localhost:3003"):
        self.base_url = base_url
        self.mcp_endpoint = f"{base_url}/mcp"
    
    async def translate_workflow(
        self,
        workflow: Dict,
        source_platform: str,
        target_platform: str,
        optimize: bool = True
    ) -> Dict:
        return await self._call_tool("translate_workflow", {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform,
            "optimize": optimize
        })
    
    async def check_feasibility(
        self,
        workflow: Dict,
        source_platform: str,
        target_platform: str
    ) -> Dict:
        return await self._call_tool("check_translation_feasibility", {
            "workflow": workflow,
            "sourcePlatform": source_platform,
            "targetPlatform": target_platform
        })
```

**5.4 Create New API Endpoints**

```python
# app/api/routes/translation.py (new file)
from fastapi import APIRouter, Depends
from app.services.translator_client import WorkflowTranslatorClient

router = APIRouter()

@router.post("/translate")
async def translate_workflow(
    request: TranslationRequest,
    translator: WorkflowTranslatorClient = Depends(get_translator_client)
):
    """
    Translate workflow from one platform to another.
    
    Request:
    {
        "workflow": {...},
        "source_platform": "n8n",
        "target_platform": "make",
        "optimize": true
    }
    """
    result = await translator.translate_workflow(
        workflow=request.workflow,
        source_platform=request.source_platform,
        target_platform=request.target_platform,
        optimize=request.optimize
    )
    
    return {
        "translated_workflow": result["workflow"],
        "warnings": result.get("warnings", []),
        "optimizations_applied": result.get("optimizations", []),
        "accuracy_score": result.get("accuracy_score", 0.85)
    }
```

### Week 6: Testing, Documentation & Deployment

**6.1 Testing Strategy**

```typescript
// tests/make-mcp/
// - Unit tests for each scraper
// - Integration tests for MCP tools
// - Validation tests against real Make scenarios

// tests/translator/
// - Test each translation direction
// - Test optimization logic
// - Test AI fallback for complex cases
// - Test error handling and warnings
```

**6.2 Deployment Configuration**

```yaml
# docker-compose.yml for microservices
version: '3.8'
services:
  make-mcp:
    build: ./make-mcp
    ports:
      - "3002:3002"
    environment:
      - MCP_MODE=http
      - PORT=3002
      - AUTH_TOKEN=${MAKE_MCP_AUTH_TOKEN}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  workflow-translator:
    build: ./workflow-translator
    ports:
      - "3003:3003"
    environment:
      - MCP_MODE=http
      - PORT=3003
      - AUTH_TOKEN=${TRANSLATOR_AUTH_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - N8N_MCP_URL=http://n8n-mcp:3001
      - MAKE_MCP_URL=http://make-mcp:3002
    depends_on:
      - make-mcp

  n8n-mcp:
    # Your existing n8n-mcp service
    ports:
      - "3001:3001"
```

**6.3 Update Backend Environment**

```python
# automation-chatbot-backend/.env additions
MAKE_MCP_URL=http://localhost:3002
MAKE_MCP_AUTH_TOKEN=your_make_mcp_token
TRANSLATOR_URL=http://localhost:3003
TRANSLATOR_AUTH_TOKEN=your_translator_token
```

## Key Implementation Details

### Make Module Schema Structure

```typescript
interface MakeModule {
    name: string;
    type: 'trigger' | 'action' | 'search' | 'instant_trigger';
    app: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
        options?: any[];
    }>;
    output: {
        example: any;
        schema: any;
    };
}
```

### Translation Mapping Example

```typescript
// Example: Translating n8n webhook to Make webhook
{
    source: {
        platform: "n8n",
        type: "n8n-nodes-base.webhook",
        parameters: {
            httpMethod: "POST",
            path: "/webhook/abc123"
        }
    },
    target: {
        platform: "make",
        module: "gateway:WebhookRespond",
        parameters: {
            method: "POST",
            // Make uses different webhook setup
            custom_webhook: true
        },
        notes: "Make webhooks work differently - URL generated after save"
    }
}
```

## Success Metrics

1. **Make-MCP Coverage**: 100+ modules documented
2. **Translation Accuracy**: 80%+ for common workflows
3. **Response Time**: <500ms for search, <2s for translation
4. **Validation Rate**: 85%+ workflows pass validation first time
5. **AI Fallback Usage**: <20% of translations need AI assistance

## Timeline Summary

- Week 1: Make-MCP foundation + database setup
- Week 2: Documentation scraping + MCP tools
- Week 3: Translator architecture + bidirectional logic
- Week 4: AI enhancement + optimization layer
- Week 5: Python backend integration + API endpoints
- Week 6: Testing, documentation, deployment

Total: 6 weeks to functional MVP with room for iteration.

### To-dos

- [ ] Create make-mcp repository structure with database schema, scraper folders, MCP server, and Docker configuration
- [ ] Define list of 100 priority Make.com modules covering HTTP, Google, Microsoft, communication, and developer tools
- [ ] Build Make.com documentation scraper to extract module parameters, types, descriptions, and examples from make.com/help
- [ ] Implement core MCP tools: search_make_modules, get_module_essentials, validate_make_scenario, list_make_templates
- [ ] Build Make scenario validator with auto-fix capabilities for common errors
- [ ] Create workflow-translator service structure with bidirectional translators for n8n, Make, and Zapier
- [ ] Define comprehensive mapping rules JSON for triggers, actions, and parameters across all three platforms
- [ ] Build core translation engine with platform-specific optimization logic
- [ ] Implement AI-enhanced translation service using Claude for complex node mappings and custom code translation
- [ ] Create optimization layer that improves workflows for target platform capabilities and best practices
- [ ] Update Python backend with MakeMcpClient and WorkflowTranslatorClient services
- [ ] Create new FastAPI endpoints for workflow translation and feasibility checking
- [ ] Build comprehensive test suite for make-mcp and translator with unit, integration, and accuracy tests
- [ ] Set up Docker Compose configuration for microservices deployment with health checks