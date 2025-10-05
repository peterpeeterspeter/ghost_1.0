/**
 * A/B Test Harness for Structured vs Narrative Prompts
 * 
 * Based on clockmaker test showing 70% success with structured JSON vs 0% with narrative.
 * Tests our ghost mannequin pipeline with both approaches to measure effectiveness.
 */

import { FactsV3, ControlBlock } from '../types/ghost';
import { generateDynamicPrompt } from '../lib/ghost/prompt-generator';
import { generateHybridStructuredPrompt, structuredPromptToText, buildStructuredPrompt } from '../lib/ghost/structured-prompt-generator';

interface TestResult {
  approach: 'narrative' | 'structured_hybrid' | 'structured_json';
  prompt: string;
  processingTime: number;
  promptLength: number;
  criticalElementsCount: number;
  structuredElementsCount: number;
}

interface TestSummary {
  results: TestResult[];
  comparison: {
    averageLength: Record<string, number>;
    averageProcessingTime: Record<string, number>;
    structuredElementRatio: Record<string, number>;
  };
}

/**
 * Sample test data based on common ghost mannequin scenarios
 */
const testScenarios: Array<{name: string, facts: FactsV3, controlBlock: ControlBlock}> = [
  {
    name: "Complex Outerwear with Multiple Elements",
    facts: {
      category_generic: "outerwear",
      silhouette: "oversized bomber jacket",
      material: "technical nylon",
      palette: {
        dominant_hex: "#2C3E50",
        accent_hex: "#E74C3C"
      },
      required_components: ["ribbed_collar", "zipper_closure", "side_pockets", "brand_patch"],
      drape_stiffness: 0.2,
      surface_sheen: "subtle_sheen",
      transparency: "opaque",
      color_temperature: "cool",
      saturation_level: "moderate"
    },
    controlBlock: {
      palette: {
        dominant_hex: "#2C3E50",
        accent_hex: "#E74C3C"
      }
    }
  },
  {
    name: "Delicate Fabric with Precise Color Requirements",
    facts: {
      category_generic: "knitwear", 
      silhouette: "relaxed cardigan",
      material: "cashmere blend",
      palette: {
        dominant_hex: "#F8F4E6",
        accent_hex: "#D4AF37"
      },
      required_components: ["button_closure", "ribbed_cuffs", "cable_knit_pattern"],
      drape_stiffness: 0.7,
      surface_sheen: "matte",
      transparency: "semi_opaque",
      color_temperature: "warm", 
      saturation_level: "muted"
    },
    controlBlock: {
      palette: {
        dominant_hex: "#F8F4E6",
        accent_hex: "#D4AF37"
      }
    }
  }
];

/**
 * Count structured elements in a prompt (JSON objects, specific hex values, technical specs)
 */
function countStructuredElements(prompt: string): number {
  const patterns = [
    /#[0-9A-Fa-f]{6}/g,           // Hex colors
    /\d+\.\d+/g,                  // Decimal numbers (drape_stiffness, etc.)
    /\{[^}]*\}/g,                 // JSON-like objects
    /"[^"]+"\s*:/g,               // JSON keys
    /\w+_\w+/g,                   // Technical terms with underscores
  ];
  
  let count = 0;
  patterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

/**
 * Count critical elements explicitly mentioned in prompt
 */
function countCriticalElements(prompt: string, facts: FactsV3): number {
  const criticalTerms = [
    'ghost mannequin',
    'invisible mannequin',
    'dimensional form',
    'no visible person',
    'e-commerce',
    'professional photography',
    facts.palette?.dominant_hex || '',
    facts.palette?.accent_hex || '',
    ...(facts.required_components || [])
  ].filter(term => term.length > 0);
  
  let count = 0;
  criticalTerms.forEach(term => {
    if (prompt.toLowerCase().includes(term.toLowerCase())) {
      count++;
    }
  });
  
  return count;
}

/**
 * Test narrative approach (current dynamic prompt generation)
 */
async function testNarrativeApproach(facts: FactsV3, controlBlock: ControlBlock): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Using existing dynamic prompt generation (narrative approach)
    const result = await generateDynamicPrompt(facts, controlBlock, 'test-session-narrative');
    
    return {
      approach: 'narrative',
      prompt: result.prompt,
      processingTime: result.processingTime,
      promptLength: result.prompt.length,
      criticalElementsCount: countCriticalElements(result.prompt, facts),
      structuredElementsCount: countStructuredElements(result.prompt)
    };
  } catch (error) {
    console.error('❌ Narrative approach failed:', error);
    throw error;
  }
}

/**
 * Test structured hybrid approach (inspired by clockmaker test)
 */
async function testStructuredHybridApproach(facts: FactsV3, controlBlock: ControlBlock): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const prompt = generateHybridStructuredPrompt(facts, controlBlock);
    const processingTime = Date.now() - startTime;
    
    return {
      approach: 'structured_hybrid',
      prompt,
      processingTime,
      promptLength: prompt.length,
      criticalElementsCount: countCriticalElements(prompt, facts),
      structuredElementsCount: countStructuredElements(prompt)
    };
  } catch (error) {
    console.error('❌ Structured hybrid approach failed:', error);
    throw error;
  }
}

/**
 * Test pure structured JSON approach (like clockmaker test)
 */
async function testStructuredJsonApproach(facts: FactsV3, controlBlock: ControlBlock): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const structured = buildStructuredPrompt(facts, controlBlock);
    const prompt = structuredPromptToText(structured);
    const processingTime = Date.now() - startTime;
    
    return {
      approach: 'structured_json',
      prompt,
      processingTime,
      promptLength: prompt.length,
      criticalElementsCount: countCriticalElements(prompt, facts),
      structuredElementsCount: countStructuredElements(prompt)
    };
  } catch (error) {
    console.error('❌ Structured JSON approach failed:', error);
    throw error;
  }
}

/**
 * Run comprehensive A/B test comparing all approaches
 */
export async function runPromptApproachTest(): Promise<TestSummary> {
  console.log('🧪 Starting A/B test of prompt approaches...');
  console.log('📊 Based on clockmaker test results: JSON 70% vs Narrative 0% success\n');
  
  const results: TestResult[] = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n🎯 Testing scenario: ${scenario.name}`);
    console.log('-------------------------------------------');
    
    try {
      // Test narrative approach
      console.log('📝 Testing narrative approach...');
      const narrativeResult = await testNarrativeApproach(scenario.facts, scenario.controlBlock);
      results.push(narrativeResult);
      console.log(`   ✅ Length: ${narrativeResult.promptLength}, Critical: ${narrativeResult.criticalElementsCount}, Structured: ${narrativeResult.structuredElementsCount}`);
      
      // Test structured hybrid
      console.log('🔄 Testing structured hybrid approach...');
      const hybridResult = await testStructuredHybridApproach(scenario.facts, scenario.controlBlock);
      results.push(hybridResult);
      console.log(`   ✅ Length: ${hybridResult.promptLength}, Critical: ${hybridResult.criticalElementsCount}, Structured: ${hybridResult.structuredElementsCount}`);
      
      // Test pure JSON structured
      console.log('📊 Testing structured JSON approach...');
      const jsonResult = await testStructuredJsonApproach(scenario.facts, scenario.controlBlock);
      results.push(jsonResult);
      console.log(`   ✅ Length: ${jsonResult.promptLength}, Critical: ${jsonResult.criticalElementsCount}, Structured: ${jsonResult.structuredElementsCount}`);
      
    } catch (error) {
      console.error(`❌ Error testing ${scenario.name}:`, error);
    }
  }
  
  // Calculate comparison metrics
  const approaches = ['narrative', 'structured_hybrid', 'structured_json'] as const;
  const comparison = {
    averageLength: {} as Record<string, number>,
    averageProcessingTime: {} as Record<string, number>,
    structuredElementRatio: {} as Record<string, number>
  };
  
  approaches.forEach(approach => {
    const approachResults = results.filter(r => r.approach === approach);
    if (approachResults.length > 0) {
      comparison.averageLength[approach] = approachResults.reduce((sum, r) => sum + r.promptLength, 0) / approachResults.length;
      comparison.averageProcessingTime[approach] = approachResults.reduce((sum, r) => sum + r.processingTime, 0) / approachResults.length;
      comparison.structuredElementRatio[approach] = approachResults.reduce((sum, r) => sum + r.structuredElementsCount, 0) / approachResults.length;
    }
  });
  
  // Print summary
  console.log('\n📈 COMPARISON RESULTS');
  console.log('====================');
  approaches.forEach(approach => {
    console.log(`\n${approach.toUpperCase()}:`);
    console.log(`   Average Length: ${Math.round(comparison.averageLength[approach] || 0)} chars`);
    console.log(`   Average Processing Time: ${Math.round(comparison.averageProcessingTime[approach] || 0)}ms`);
    console.log(`   Structured Elements: ${Math.round(comparison.structuredElementRatio[approach] || 0)} avg`);
  });
  
  return {
    results,
    comparison
  };
}

/**
 * Export individual test functions for direct use
 */
export {
  testNarrativeApproach,
  testStructuredHybridApproach, 
  testStructuredJsonApproach,
  countStructuredElements,
  countCriticalElements
};