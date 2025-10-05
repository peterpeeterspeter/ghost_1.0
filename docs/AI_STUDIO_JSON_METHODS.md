# AI Studio JSON & Image Input Methods

## 📋 **Current Pipeline vs AI Studio Approaches**

### **Current Pipeline Flow**
```
Analysis JSON + Enrichment JSON → FactsV3 Consolidation → Dynamic Prompt Generation → Freepik
```

### **AI Studio Alternative Options**
```
Option 1: Same as current (FactsV3 → Dynamic Prompt → AI Studio)
Option 2: Raw JSON → Structured Input → AI Studio  
Option 3: Hybrid approaches with different data formats
```

## 🎯 **The Key Question You Asked**

> **"Can we feed the JSON different in AI Studio? And the images, base64 inline or directly URL?"**

**Answer: YES!** AI Studio supports multiple input methods that are more flexible than most external APIs.

---

## 📊 **JSON Input Methods**

### **Method 1: SEPARATE (Recommended for Large JSON)**
```typescript
// JSON as binary data with application/json MIME type
contentParts = [
  { text: "Create ghost mannequin from analysis data and images..." },
  { text: "Analysis Data (Garment structure, labels, construction):" },
  { 
    inlineData: { 
      data: base64EncodedJSON, 
      mimeType: 'application/json' 
    } 
  },
  { text: "Enrichment Data (Colors, materials, rendering guidance):" },
  { 
    inlineData: { 
      data: base64EncodedEnrichmentJSON, 
      mimeType: 'application/json' 
    } 
  }
]
```
**Advantages:**
- ✅ Clean separation of prompt and data
- ✅ Preserves JSON structure for AI processing
- ✅ Best for complex, large JSON payloads
- ✅ Native structured data handling

### **Method 2: INLINE (Good for Medium JSON)**
```typescript
contentParts = [
  { text: "Create ghost mannequin..." },
  { text: `Analysis Data: ${JSON.stringify(analysisJSON, null, 2)}` },
  { text: `Enrichment Data: ${JSON.stringify(enrichmentJSON, null, 2)}` }
]
```
**Advantages:**
- ✅ Readable by AI as text
- ✅ Simpler structure
- ⚠️ Less structured than binary method

### **Method 3: EMBEDDED (Compact for Small JSON)**
```typescript
contentParts = [
  { 
    text: `Create ghost mannequin...
    
    Analysis Data: ${JSON.stringify(analysisJSON, null, 2)}
    
    Enrichment Data: ${JSON.stringify(enrichmentJSON, null, 2)}` 
  }
]
```
**Advantages:**
- ✅ Most compact payload
- ✅ Single prompt structure
- ⚠️ May lose some JSON structure context

---

## 🖼️ **Image Input Methods**

### **Method 1: BASE64 INLINE (Current/Recommended)**
```typescript
{
  inlineData: {
    data: base64ImageData,      // Converted from URL/file
    mimeType: 'image/jpeg'      // Auto-detected
  }
}
```
**Advantages:**
- ✅ **Guaranteed compatibility** - works with all image sources
- ✅ Self-contained - no external dependencies
- ✅ Works with cleaned/processed images from FAL
- ⚠️ Larger payload size

### **Method 2: URL DIRECT (Experimental)**
```typescript
{
  text: `Image URL: ${imageUrl}`
}
```
**Advantages:**
- ✅ Smaller payloads
- ✅ Faster transmission
- ❌ **May not be supported** by AI Studio
- ❌ Requires publicly accessible URLs

### **Method 3: AUTO (Smart Detection)**
```typescript
// Tries URL first, falls back to base64 if needed
const imageData = await prepareImageForAiStudio(imageInput);
```

---

## 🔄 **Current vs Enhanced Pipeline Comparison**

### **Current AI Studio Integration (Simple)**
```typescript
// What we built initially
generateGhostMannequinWithAiStudio(
  flatlayImage,         // URL/base64
  consolidation,        // FactsV3 + ControlBlock (processed)  
  originalImage?,       // Optional reference
  sessionId?
)
```
**Flow:** `Raw JSON → FactsV3 Consolidation → Dynamic Prompt → AI Studio`

### **Enhanced AI Studio Integration (Flexible)**
```typescript
// New enhanced version
generateGhostMannequinWithStructuredJSON(
  flatlayImage,         // URL/base64
  analysisJSON,         // Raw analysis JSON (direct from Gemini)
  enrichmentJSON,       // Raw enrichment JSON (direct from Gemini)
  originalImage?,       // Optional reference
  sessionId?,
  options: {
    jsonInputMethod: 'separate' | 'inline' | 'embedded',
    imageInputMethod: 'base64' | 'url' | 'auto',
    useSimplePrompt: boolean
  }
)
```
**Flow:** `Raw JSON → Direct AI Studio Input (bypasses consolidation)`

---

## 🚀 **Usage Examples**

### **Example 1: Maximum Structured Input**
```javascript
const result = await generateGhostMannequinWithStructuredJSON(
  cleanedFlatlayUrl,
  rawAnalysisJSON,      // Direct from analyzeGarment()
  rawEnrichmentJSON,    // Direct from analyzeGarmentEnrichment() 
  originalOnModelUrl,
  sessionId,
  {
    jsonInputMethod: 'separate',    // JSON as binary data
    imageInputMethod: 'base64',     // Guaranteed compatibility
    useSimplePrompt: false          // Rich prompt
  }
);
```

### **Example 2: Compact Input**
```javascript
const result = await generateGhostMannequinWithStructuredJSON(
  cleanedFlatlayUrl,
  rawAnalysisJSON,
  rawEnrichmentJSON,
  originalOnModelUrl,
  sessionId,
  {
    jsonInputMethod: 'embedded',    // JSON in prompt
    imageInputMethod: 'auto',       // Smart detection
    useSimplePrompt: true           // Simple prompt
  }
);
```

### **Example 3: Current Method (Unchanged)**
```javascript
// Still available - uses FactsV3 consolidation
const result = await generateGhostMannequinWithAiStudio(
  cleanedFlatlayUrl,
  consolidationOutput,  // FactsV3 + ControlBlock processed data
  originalOnModelUrl,
  sessionId
);
```

---

## 📈 **Performance Comparison**

| Method | Payload Size | Processing Speed | JSON Structure | Best For |
|--------|--------------|------------------|----------------|----------|
| **Current (FactsV3)** | Medium | Fast | Processed | Production use |
| **Separate JSON** | Large | Medium | Preserved | Complex analysis |
| **Inline JSON** | Medium | Fast | Partial | Balanced approach |
| **Embedded JSON** | Small | Fastest | Basic | Simple cases |

---

## 🛠️ **Implementation Status**

### ✅ **What's Available Now**
1. **Current Integration**: `generateGhostMannequinWithAiStudio()` - Uses FactsV3 consolidation
2. **Enhanced Integration**: `generateGhostMannequinWithStructuredJSON()` - Raw JSON input
3. **Multiple JSON Methods**: separate, inline, embedded
4. **Multiple Image Methods**: base64, url, auto
5. **Pipeline Integration**: Both methods available as `renderingModel: 'ai-studio'`

### 🔧 **How to Choose**

**Use Current Method When:**
- ✅ You want production-ready, tested approach
- ✅ You like the FactsV3 consolidation system
- ✅ You want compatibility with existing Freepik workflows

**Use Enhanced Method When:**
- ✅ You want maximum control over JSON structure
- ✅ You want to bypass consolidation processing
- ✅ You want to experiment with different input formats
- ✅ You have very large or very small JSON payloads

---

## 📝 **Migration Options**

### **Option 1: Keep Current (No Changes)**
```javascript
// Continue using Freepik as primary
renderingModel: 'freepik-gemini'

// Use AI Studio as alternative when needed
renderingModel: 'ai-studio'  // Uses FactsV3 consolidation
```

### **Option 2: Add Enhanced Methods**
```javascript
// Add new pipeline option for raw JSON
renderingModel: 'ai-studio-raw'  // Uses direct JSON input

// Or call directly
import { generateGhostMannequinWithStructuredJSON } from './lib/ghost/ai-studio.js';
```

### **Option 3: Hybrid Approach** 
```javascript
// Use different methods for different garment types
if (complexGarment) {
  // Use separate JSON method for detailed analysis
  method = 'separate';
} else {
  // Use embedded JSON method for simple garments
  method = 'embedded';
}
```

---

## 🎯 **Recommendations**

1. **For Your Current Use Case**: Keep using the current successful Freepik setup as primary
2. **For AI Studio Testing**: Use the enhanced structured JSON methods to experiment
3. **For Production**: Start with `jsonInputMethod: 'separate'` and `imageInputMethod: 'base64'`
4. **For Performance**: Test different combinations to find optimal settings

The enhanced AI Studio integration gives you **complete flexibility** in how you feed JSON and images, while maintaining backward compatibility with your current successful pipeline.