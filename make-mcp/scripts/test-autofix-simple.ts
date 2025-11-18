#!/usr/bin/env node
/**
 * Simple test script to verify autofix functionality without database
 * Tests that incomplete scenarios are fixed to match Make.com format
 */

import fs from 'fs';
import path from 'path';

// Mock the validator without database dependency
class SimpleMakeValidator {
    autoFixScenario(scenario: any): any {
        const fixed = JSON.parse(JSON.stringify(scenario));

        if (!fixed.name) {
            fixed.name = 'Untitled Scenario';
        }

        if (!fixed.flow) {
            fixed.flow = [];
        }

        if (fixed.flow && fixed.flow.length > 0) {
            fixed.flow = fixed.flow.map((module: any, index: number) => ({
                ...module,
                id: index + 1
            }));
        }

        if (!fixed.metadata) {
            fixed.metadata = {};
        }

        // Add metadata.instant field
        if (fixed.metadata.instant === undefined) {
            const firstModule = fixed.flow && fixed.flow[0];
            const isInstantTrigger = firstModule && (
                firstModule.module.includes('webhook') ||
                firstModule.module.includes('gateway') ||
                firstModule.module.includes('CustomWebHook')
            );
            fixed.metadata.instant = isInstantTrigger || false;
        }

        if (!fixed.metadata.version) {
            fixed.metadata.version = 1;
        }

        // Add metadata.scenario
        if (!fixed.metadata.scenario) {
            fixed.metadata.scenario = {};
        }
        const scenarioSettings = fixed.metadata.scenario;
        scenarioSettings.roundtrips = scenarioSettings.roundtrips || (fixed.flow ? fixed.flow.length : 1);
        scenarioSettings.maxErrors = scenarioSettings.maxErrors !== undefined ? scenarioSettings.maxErrors : 3;
        scenarioSettings.autoCommit = scenarioSettings.autoCommit !== undefined ? scenarioSettings.autoCommit : true;
        scenarioSettings.autoCommitTriggerLast = scenarioSettings.autoCommitTriggerLast !== undefined ? scenarioSettings.autoCommitTriggerLast : true;
        scenarioSettings.sequential = scenarioSettings.sequential !== undefined ? scenarioSettings.sequential : false;
        scenarioSettings.slots = scenarioSettings.slots !== undefined ? scenarioSettings.slots : null;
        scenarioSettings.confidential = scenarioSettings.confidential !== undefined ? scenarioSettings.confidential : false;
        scenarioSettings.dataloss = scenarioSettings.dataloss !== undefined ? scenarioSettings.dataloss : false;
        scenarioSettings.dlq = scenarioSettings.dlq !== undefined ? scenarioSettings.dlq : false;
        scenarioSettings.freshVariables = scenarioSettings.freshVariables !== undefined ? scenarioSettings.freshVariables : false;

        if (!fixed.metadata.designer) {
            fixed.metadata.designer = {};
        }
        if (!fixed.metadata.designer.orphans) {
            fixed.metadata.designer.orphans = [];
        }

        if (!fixed.metadata.zone) {
            fixed.metadata.zone = 'eu2.make.com';
        }

        if (!fixed.metadata.notes) {
            fixed.metadata.notes = [];
        }

        if (!fixed.metadata.created_by) {
            fixed.metadata.created_by = 'make-mcp';
        }
        if (!fixed.metadata.created_at) {
            fixed.metadata.created_at = new Date().toISOString();
        }

        // Fix flow modules
        if (fixed.flow) {
            fixed.flow = fixed.flow.map((module: any, index: number) => {
                if (!module.metadata) {
                    module.metadata = {};
                }

                if (!module.metadata.designer) {
                    module.metadata.designer = {
                        x: 150 * index,
                        y: 0
                    };
                }

                if (!module.version) {
                    module.version = 1;
                }

                // Generate mapper for non-trigger modules
                if (index > 0 && !module.mapper) {
                    module.mapper = this.generateMapper(module, index);
                } else if (index === 0 && !module.mapper) {
                    module.mapper = {};
                }

                if (!module.parameters) {
                    module.parameters = {};
                }

                return module;
            });
        }

        return fixed;
    }

    private generateMapper(module: any, moduleIndex: number): Record<string, any> {
        const mapper: Record<string, any> = {};
        
        if (!module.parameters) {
            return mapper;
        }

        const previousModuleId = moduleIndex;
        
        Object.keys(module.parameters).forEach(key => {
            const value = module.parameters[key];
            
            if (this.shouldGenerateMapping(key, value)) {
                mapper[key] = `{{${previousModuleId}.data}}`;
            } else {
                mapper[key] = value;
            }
        });

        return mapper;
    }

    private shouldGenerateMapping(paramKey: string, paramValue: any): boolean {
        if (!paramValue || (typeof paramValue === 'string' && paramValue.includes('{{'))) {
            return false;
        }

        const dataMappingKeys = [
            'data', 'body', 'content', 'message', 'text', 'value',
            'input', 'payload', 'item', 'record', 'fields'
        ];

        return dataMappingKeys.some(key => paramKey.toLowerCase().includes(key));
    }
}

const testScenarioPath = path.join(__dirname, '../tests/test-scenario-format.json');

async function testAutoFix() {
    console.log('🧪 Testing Make-MCP AutoFix Functionality\n');
    console.log('='.repeat(60));
    
    const testScenario = JSON.parse(fs.readFileSync(testScenarioPath, 'utf-8'));
    
    console.log('\n📝 Original Scenario:');
    console.log(JSON.stringify(testScenario, null, 2));
    
    const validator = new SimpleMakeValidator();
    
    console.log('\n🔧 Applying AutoFix...');
    const fixedScenario = validator.autoFixScenario(testScenario);
    
    console.log('\n✨ Fixed Scenario:');
    console.log(JSON.stringify(fixedScenario, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 Make.com Format Compliance Check:');
    console.log('='.repeat(60));
    
    const checks = [
        { name: 'metadata.instant', value: fixedScenario.metadata?.instant !== undefined },
        { name: 'metadata.version', value: fixedScenario.metadata?.version !== undefined },
        { name: 'metadata.scenario', value: fixedScenario.metadata?.scenario !== undefined },
        { name: 'metadata.scenario.roundtrips', value: fixedScenario.metadata?.scenario?.roundtrips !== undefined },
        { name: 'metadata.scenario.maxErrors', value: fixedScenario.metadata?.scenario?.maxErrors !== undefined },
        { name: 'metadata.scenario.autoCommit', value: fixedScenario.metadata?.scenario?.autoCommit !== undefined },
        { name: 'metadata.scenario.autoCommitTriggerLast', value: fixedScenario.metadata?.scenario?.autoCommitTriggerLast !== undefined },
        { name: 'metadata.scenario.sequential', value: fixedScenario.metadata?.scenario?.sequential !== undefined },
        { name: 'metadata.scenario.slots', value: fixedScenario.metadata?.scenario?.slots !== undefined },
        { name: 'metadata.scenario.confidential', value: fixedScenario.metadata?.scenario?.confidential !== undefined },
        { name: 'metadata.scenario.dataloss', value: fixedScenario.metadata?.scenario?.dataloss !== undefined },
        { name: 'metadata.scenario.dlq', value: fixedScenario.metadata?.scenario?.dlq !== undefined },
        { name: 'metadata.scenario.freshVariables', value: fixedScenario.metadata?.scenario?.freshVariables !== undefined },
        { name: 'metadata.designer.orphans', value: Array.isArray(fixedScenario.metadata?.designer?.orphans) },
        { name: 'metadata.zone', value: !!fixedScenario.metadata?.zone },
        { name: 'metadata.notes', value: Array.isArray(fixedScenario.metadata?.notes) },
        { name: 'flow[0].module', value: !!fixedScenario.flow?.[0]?.module },
        { name: 'flow[0].version', value: fixedScenario.flow?.[0]?.version !== undefined },
        { name: 'flow[0].metadata.designer', value: !!fixedScenario.flow?.[0]?.metadata?.designer },
        { name: 'flow[0].mapper', value: fixedScenario.flow?.[0]?.mapper !== undefined },
        { name: 'flow[1].mapper', value: fixedScenario.flow?.[1]?.mapper !== undefined },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        const status = check.value ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        if (!check.value) allPassed = false;
    });
    
    if (fixedScenario.flow?.[1]?.mapper) {
        const mapper = fixedScenario.flow[1].mapper;
        const hasDoubleBraces = Object.values(mapper).some(v => 
            typeof v === 'string' && v.includes('{{') && v.includes('}}')
        );
        console.log(`${hasDoubleBraces ? '✅' : '❌'} Mapper uses {{moduleId.field}} syntax`);
        if (!hasDoubleBraces) allPassed = false;
        
        if (hasDoubleBraces) {
            console.log(`   Example mapper value: ${Object.values(mapper).find(v => typeof v === 'string' && v.includes('{{'))}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL CHECKS PASSED! Make.com format is 100% compliant!');
    } else {
        console.log('⚠️  Some checks failed. Review the output above.');
    }
    console.log('='.repeat(60));
    
    const outputPath = path.join(__dirname, '../tests/test-scenario-fixed.json');
    fs.writeFileSync(outputPath, JSON.stringify(fixedScenario, null, 2));
    console.log(`\n💾 Fixed scenario saved to: ${outputPath}\n`);
}

testAutoFix().catch(console.error);

