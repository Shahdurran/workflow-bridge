/**
 * Enhanced Auto-Fix Examples for Make-MCP
 * 
 * Demonstrates all the new features brought from n8n-MCP:
 * - Detailed fix reports
 * - Confidence levels
 * - Granular control
 * - Before/after validation
 */

import { MakeValidator } from '../src/services/make-validator';
import { MakeScenario } from '../src/types';

// Example scenario with common issues
const scenarioWithIssues = {
    name: "Webhook to Slack",
    flow: [
        {
            id: 1,
            module: "gateway:CustomWebHook"
            // Missing: version, parameters, mapper, metadata
        },
        {
            id: 2,
            module: "slack:createMessage",
            parameters: {
                channel: "#general",
                text: "New webhook received"
            }
            // Missing: version, mapper, metadata
        }
    ]
    // Missing: Complete metadata structure
};

// Example 1: Basic Auto-Fix (Recommended)
async function example1_basicAutoFix() {
    console.log("=== Example 1: Basic Auto-Fix ===\n");
    
    const validator = new MakeValidator();
    
    const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues);
    
    if (result.success) {
        console.log("✅ Auto-fix successful!");
        console.log(`📊 Summary: ${result.fixReport.summary}`);
        console.log(`🔧 Total fixes: ${result.fixReport.totalFixes}`);
        
        console.log("\nFixes by type:");
        Object.entries(result.fixReport.fixesByType).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`  ${type}: ${count}`);
            }
        });
        
        console.log("\nFixes by confidence:");
        Object.entries(result.fixReport.fixesByConfidence).forEach(([level, count]) => {
            console.log(`  ${level}: ${count}`);
        });
        
        console.log("\nValidation comparison:");
        console.log(`  Before: ${result.originalValidation.errors.length} errors`);
        console.log(`  After:  ${result.validationResult?.errors.length || 0} errors`);
        
        return result.fixedScenario;
    }
}

// Example 2: Conservative Auto-Fix (HIGH confidence only)
async function example2_conservativeAutoFix() {
    console.log("\n=== Example 2: Conservative Auto-Fix ===\n");
    
    const validator = new MakeValidator();
    
    const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues, {
        confidenceThreshold: 'high'  // Only HIGH confidence fixes
    });
    
    if (result.success) {
        console.log("✅ Conservative auto-fix complete");
        console.log(`Fixed ${result.fixReport.totalFixes} HIGH confidence issues`);
        
        console.log("\nHigh confidence fixes:");
        result.fixReport.fixes.forEach((fix, i) => {
            console.log(`${i + 1}. ${fix.module}.${fix.field}`);
            console.log(`   ${fix.description}`);
        });
        
        if (result.validationResult && !result.validationResult.valid) {
            console.log(`\n⚠️  Still has ${result.validationResult.errors.length} errors`);
            console.log("These may need manual review or MEDIUM confidence fixes");
        }
        
        return result.fixedScenario;
    }
}

// Example 3: Preview Fixes Before Applying
async function example3_previewFixes() {
    console.log("\n=== Example 3: Preview Fixes ===\n");
    
    const validator = new MakeValidator();
    
    // Step 1: Preview without applying
    const preview = await validator.autoFixScenarioEnhanced(scenarioWithIssues, {
        applyFixes: false  // Don't apply, just report
    });
    
    console.log("🔍 Fix preview:");
    console.log(`Total fixes available: ${preview.fixReport.totalFixes}\n`);
    
    console.log("Detailed fixes:");
    preview.fixReport.fixes.forEach((fix, i) => {
        console.log(`${i + 1}. [${fix.confidence.toUpperCase()}] ${fix.module}.${fix.field}`);
        console.log(`   ${fix.description}`);
        console.log(`   Before: ${JSON.stringify(fix.before)}`);
        console.log(`   After:  ${JSON.stringify(fix.after)}\n`);
    });
    
    // Step 2: User approves, apply fixes
    console.log("✅ User approved, applying fixes...\n");
    
    const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues, {
        applyFixes: true
    });
    
    return result.fixedScenario;
}

// Example 4: Targeted Fix Types
async function example4_targetedFixes() {
    console.log("\n=== Example 4: Targeted Fixes ===\n");
    
    const validator = new MakeValidator();
    
    // Only fix metadata and mapper
    const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues, {
        fixTypes: ['metadata', 'mapper']
    });
    
    console.log("✅ Targeted fixes applied");
    console.log(`Fixed types: metadata (${result.fixReport.fixesByType.metadata || 0}), mapper (${result.fixReport.fixesByType.mapper || 0})`);
    
    console.log("\nApplied fixes:");
    result.fixReport.fixes.forEach(fix => {
        console.log(`  ${fix.type}: ${fix.description}`);
    });
    
    return result.fixedScenario;
}

// Example 5: Incremental Fixing
async function example5_incrementalFixes() {
    console.log("\n=== Example 5: Incremental Fixing ===\n");
    
    const validator = new MakeValidator();
    let scenario = { ...scenarioWithIssues };
    let iteration = 1;
    
    while (true) {
        console.log(`Iteration ${iteration}:`);
        
        const result = await validator.autoFixScenarioEnhanced(scenario, {
            maxFixes: 3  // Fix 3 at a time
        });
        
        console.log(`  Fixed ${result.fixReport.totalFixes} issues`);
        
        if (result.validationResult?.valid) {
            console.log("\n✅ Scenario is now valid!");
            return result.fixedScenario;
        }
        
        if (result.fixReport.totalFixes === 0) {
            console.log("\n⚠️  No more auto-fixable issues");
            console.log(`Remaining errors: ${result.validationResult?.errors.length || 0}`);
            break;
        }
        
        scenario = result.fixedScenario!;
        iteration++;
        
        if (iteration > 10) {
            console.log("\n⚠️  Max iterations reached");
            break;
        }
    }
}

// Example 6: Error Handling
async function example6_errorHandling() {
    console.log("\n=== Example 6: Error Handling ===\n");
    
    const validator = new MakeValidator();
    
    try {
        const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues);
        
        if (!result.success) {
            console.error(`❌ Auto-fix failed: ${result.error}`);
            console.log("Falling back to original scenario");
            return scenarioWithIssues;
        }
        
        if (result.validationResult && !result.validationResult.valid) {
            console.warn(`⚠️  Still has ${result.validationResult.errors.length} errors:`);
            result.validationResult.errors.forEach(err => {
                console.log(`  - ${err.code}: ${err.message}`);
            });
            
            // Decide whether to accept partial fix
            if (result.validationResult.errors.length <= 2) {
                console.log("\n✅ Accepting scenario with minor issues");
                return result.fixedScenario;
            } else {
                console.log("\n❌ Too many remaining errors, rejecting");
                return null;
            }
        }
        
        console.log("✅ Scenario fully fixed and valid!");
        return result.fixedScenario;
        
    } catch (error) {
        console.error('Auto-fix exception:', error);
        return scenarioWithIssues;  // Fallback
    }
}

// Example 7: Compare with Old Auto-Fix
async function example7_comparison() {
    console.log("\n=== Example 7: Old vs New Auto-Fix ===\n");
    
    const validator = new MakeValidator();
    
    // Old way (still works)
    console.log("OLD METHOD:");
    const validation = validator.validateScenario(scenarioWithIssues);
    const oldFixed = validator.autoFixScenario(scenarioWithIssues, validation.errors);
    console.log("  Fixed scenario (no details)\n");
    
    // New way (enhanced)
    console.log("NEW METHOD:");
    const result = await validator.autoFixScenarioEnhanced(scenarioWithIssues);
    console.log(`  Summary: ${result.fixReport.summary}`);
    console.log(`  Total fixes: ${result.fixReport.totalFixes}`);
    console.log(`  Confidence breakdown: HIGH: ${result.fixReport.fixesByConfidence.high}, MEDIUM: ${result.fixReport.fixesByConfidence.medium}`);
    console.log(`  Errors before: ${result.originalValidation.errors.length}`);
    console.log(`  Errors after: ${result.validationResult?.errors.length || 0}`);
    
    console.log("\n✨ Enhanced version provides much more visibility!");
}

// Example 8: Real-World AI Integration
async function example8_aiIntegration() {
    console.log("\n=== Example 8: AI Integration Pattern ===\n");
    
    // Simulate AI generating a scenario
    const aiGenerated = {
        name: "AI Generated Workflow",
        flow: [
            { id: 1, module: "gateway:CustomWebHook", parameters: {} },
            { id: 2, module: "http:ActionSendData", parameters: {
                url: "https://api.example.com",
                method: "POST"
            }}
        ]
    };
    
    console.log("1. AI generated basic scenario");
    
    const validator = new MakeValidator();
    
    // 2. Validate
    console.log("2. Validating...");
    const validation = validator.validateScenario(aiGenerated);
    console.log(`   Found ${validation.errors.length} errors`);
    
    if (!validation.valid) {
        // 3. Auto-fix
        console.log("3. Auto-fixing with HIGH confidence...");
        const result = await validator.autoFixScenarioEnhanced(aiGenerated, {
            confidenceThreshold: 'high'
        });
        
        console.log(`   ${result.fixReport.summary}`);
        
        if (result.validationResult?.valid) {
            console.log("4. ✅ Scenario is now 100% Make.com compliant!");
            console.log("5. Ready to import into Make.com!");
            return result.fixedScenario;
        } else {
            console.log(`4. ⚠️  ${result.validationResult?.errors.length} issues remain`);
            console.log("5. May need manual review");
        }
    }
}

// Run all examples
async function runAllExamples() {
    console.log("╔════════════════════════════════════════════╗");
    console.log("║  Enhanced Auto-Fix Examples - Make-MCP     ║");
    console.log("╚════════════════════════════════════════════╝\n");
    
    await example1_basicAutoFix();
    await example2_conservativeAutoFix();
    await example3_previewFixes();
    await example4_targetedFixes();
    await example5_incrementalFixes();
    await example6_errorHandling();
    await example7_comparison();
    await example8_aiIntegration();
    
    console.log("\n✅ All examples completed!");
}

// Export for use in tests
export {
    scenarioWithIssues,
    example1_basicAutoFix,
    example2_conservativeAutoFix,
    example3_previewFixes,
    example4_targetedFixes,
    example5_incrementalFixes,
    example6_errorHandling,
    example7_comparison,
    example8_aiIntegration,
    runAllExamples
};

// Run if executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}

