#!/usr/bin/env node
/**
 * Test script to verify autofix functionality
 * Tests that incomplete scenarios are fixed to match Make.com format
 */

import fs from 'fs';
import path from 'path';
import { MakeValidator } from '../src/services/make-validator';

const testScenarioPath = path.join(__dirname, '../tests/test-scenario-format.json');

async function testAutoFix() {
    console.log('🧪 Testing Make-MCP AutoFix Functionality\n');
    console.log('='.repeat(60));
    
    // Read test scenario
    const testScenario = JSON.parse(fs.readFileSync(testScenarioPath, 'utf-8'));
    
    console.log('\n📝 Original Scenario:');
    console.log(JSON.stringify(testScenario, null, 2));
    
    // Initialize validator
    const validator = new MakeValidator();
    
    // Validate original
    console.log('\n🔍 Validating Original Scenario...');
    const validationResult = validator.validateScenario(testScenario, 'balanced');
    
    console.log(`\n✓ Valid: ${validationResult.valid}`);
    console.log(`✓ Errors: ${validationResult.errors.length}`);
    console.log(`✓ Warnings: ${validationResult.warnings.length}`);
    
    if (validationResult.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validationResult.warnings.forEach(w => {
            console.log(`  - ${w.code}: ${w.message}`);
        });
    }
    
    if (validationResult.errors.length > 0) {
        console.log('\n❌ Errors:');
        validationResult.errors.forEach(e => {
            console.log(`  - ${e.code}: ${e.message}`);
        });
    }
    
    // Apply autofix
    console.log('\n🔧 Applying AutoFix...');
    const fixedScenario = validator.autoFixScenario(testScenario, validationResult.errors);
    
    // Validate fixed scenario
    console.log('\n🔍 Validating Fixed Scenario...');
    const fixedValidation = validator.validateScenario(fixedScenario, 'balanced');
    
    console.log(`\n✓ Valid: ${fixedValidation.valid}`);
    console.log(`✓ Errors: ${fixedValidation.errors.length}`);
    console.log(`✓ Warnings: ${fixedValidation.warnings.length}`);
    
    // Show fixed scenario
    console.log('\n✨ Fixed Scenario:');
    console.log(JSON.stringify(fixedScenario, null, 2));
    
    // Check for Make.com required fields
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
        { name: 'flow[1].mapper (with {{}} syntax)', value: fixedScenario.flow?.[1]?.mapper !== undefined },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
        const status = check.value ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        if (!check.value) allPassed = false;
    });
    
    // Check mapper syntax
    if (fixedScenario.flow?.[1]?.mapper) {
        const mapper = fixedScenario.flow[1].mapper;
        const hasDoubleBraces = Object.values(mapper).some(v => 
            typeof v === 'string' && v.includes('{{') && v.includes('}}')
        );
        console.log(`${hasDoubleBraces ? '✅' : '❌'} Mapper uses {{moduleId.field}} syntax`);
        if (!hasDoubleBraces) allPassed = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL CHECKS PASSED! Make.com format is 100% compliant!');
    } else {
        console.log('⚠️  Some checks failed. Review the output above.');
    }
    console.log('='.repeat(60));
    
    // Save fixed scenario
    const outputPath = path.join(__dirname, '../tests/test-scenario-fixed.json');
    fs.writeFileSync(outputPath, JSON.stringify(fixedScenario, null, 2));
    console.log(`\n💾 Fixed scenario saved to: ${outputPath}`);
    
    validator.close();
}

testAutoFix().catch(console.error);

