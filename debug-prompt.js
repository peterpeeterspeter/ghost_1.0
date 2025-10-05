// Debug script to show exactly what gets sent to Gemini Flash
// Run this to see the exact structure

console.log("=== CURRENT IMPLEMENTATION ===\n");

// Simulated analysis data (example)
const exampleAnalysis = {
  type: 'garment_analysis',
  meta: { schema_version: '4.1', session_id: 'test-123' },
  labels_found: [
    { type: 'brand', location: 'neck label', preserve: true, readable: true },
    { type: 'size', location: 'side seam', preserve: false, readable: true }
  ],
  preserve_details: [
    { element: 'brand logo', priority: 'critical', notes: 'Keep sharp' },
    { element: 'button details', priority: 'important', notes: 'Preserve texture' },
    { element: 'seam stitching', priority: 'nice_to_have', notes: 'Optional' }
  ]
};

// Current sanitization process
const criticalElements = exampleAnalysis.preserve_details
  .filter(detail => detail.priority === 'critical')
  .map(detail => detail.element)
  .join(', ');

const labelRequirements = exampleAnalysis.labels_found
  .filter(label => label.preserve)
  .map(label => `${label.type} at ${label.location}`)
  .join(', ');

console.log("1. JSON ANALYSIS DATA PROCESSING:");
console.log("   Full Analysis Object:", JSON.stringify(exampleAnalysis, null, 2));
console.log("\n   Extracted Critical Elements:", criticalElements);
console.log("   Extracted Label Requirements:", labelRequirements);

console.log("\n2. WHAT GETS SENT TO GEMINI FLASH:");
console.log("   Structure: contentParts array with:");
console.log("   - Part 1: Text prompt (with sanitized JSON data embedded)");
console.log("   - Part 2: 'Image A (Shape Reference):' text label");
console.log("   - Part 3: Image A data (base64 + mimeType)");
console.log("   - Part 4: 'Image B (Detail Source):' text label"); 
console.log("   - Part 5: Image B data (base64 + mimeType)");

console.log("\n3. PROMPT WITH EMBEDDED JSON DATA:");
const prompt = `Professional Ghost Mannequin Synthesis

MISSION: Create a professional, three-dimensional ghost mannequin photograph for e-commerce. The final image must show the garment with realistic 3D volume and shape, as if worn on an unseen form, using the provided source files.

SOURCE FILE ROLES
IMAGE A (Shape Reference): Use this original photo to understand the garment's overall 3D shape, volume, and how it drapes. This defines the pose and form.
IMAGE B (Texture & Detail Source): This cleaned garment photo is the source of truth for all visual surfaces. Use it for the exact fabric color, pattern, texture, seams, and the sharpest version of brand labels.

CRITICAL PRESERVATION REQUIREMENTS:
Elements: ${criticalElements}
Labels: ${labelRequirements}

STEP-BY-STEP SYNTHESIS
[... rest of prompt ...]`;

console.log(prompt);

console.log("\n=== SUMMARY ===");
console.log("✅ JSON Analysis: PROCESSED and SANITIZED before inclusion");
console.log("✅ Two Images: Sent as separate base64 data parts");  
console.log("✅ Prompt: Single text with embedded analysis data");
console.log("❌ Raw JSON: NOT sent as separate file/part");
console.log("❌ Full JSON: NOT included (only critical/preserve items)");
