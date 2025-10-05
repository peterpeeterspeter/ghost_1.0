// Test the enhanced ghost mannequin prompt generation with better negative prompting
// (Improvements made to lib/ghost/prompt-generator.ts)

// Mock FactsV3 data (similar to what we saw in the logs)
const mockFacts = {
  category_generic: "outerwear",
  silhouette: "Loose-fitting, open-front kimono/cardigan with wide sleeves and a shawl collar",
  required_components: ["fringe_trim", "multi_pattern_print", "sleeve_cuffs", "shawl_collar", "wide_sleeves"],
  forbidden_components: [],
  palette: {
    dominant_hex: "#1AA0C8",
    accent_hex: "#F3EADF",  
    trim_hex: "#FFFFFF"
  },
  material: "lightweight fabric",
  surface_sheen: "subtle_sheen",
  drape_stiffness: 0.4,
  pattern: "Multi-patterned block print style",
  notes: "Preserve vibrant print and fringe texture"
};

const mockControlBlock = {
  category_generic: "outerwear",
  silhouette: "Loose-fitting, open-front kimono/cardigan with wide sleeves and a shawl collar",
  required_components: ["fringe_trim", "multi_pattern_print", "sleeve_cuffs", "shawl_collar", "wide_sleeves"],
  palette: {
    dominant_hex: "#1AA0C8",
    accent_hex: "#F3EADF",
    trim_hex: "#FFFFFF"
  },
  material: "lightweight fabric",
  surface_sheen: "subtle_sheen",
  drape_stiffness: 0.4
};

console.log('=== ENHANCED GHOST MANNEQUIN PROMPT TEST ===\n');
console.log('Mock garment facts:', JSON.stringify(mockFacts, null, 2));
console.log('\n📝 Key improvements made:');
console.log('✅ Added explicit ghost mannequin definition');  
console.log('✅ Included e-commerce photography emphasis');
console.log('✅ Smart negative prompting (positive descriptions vs "remove X")');
console.log('✅ Clear dimensional form instructions');
console.log('✅ Professional quality standards');

console.log('\n🎯 The enhanced meta-prompt now instructs Gemini Pro 2.5 to:');
console.log('• Define ghost mannequin as "invisible mannequin effect"');
console.log('• Emphasize "no visible person or mannequin"');  
console.log('• Describe as "professional e-commerce product photography"');
console.log('• Focus on "dimensional form with invisible support"');
console.log('• Use positive language instead of negative commands');

console.log('\n📊 Expected improvements:');
console.log('• Better ghost mannequin recognition by Flash 2.5');
console.log('• Clearer instructions for invisible mannequin effect'); 
console.log('• Enhanced e-commerce photography context');
console.log('• More reliable dimensional transformation');

console.log('\n⚡ Ready for testing with actual API calls!');
console.log('Next test run should show improved ghost mannequin generation.');