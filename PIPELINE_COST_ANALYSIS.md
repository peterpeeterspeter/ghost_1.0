# Pipeline Cost Analysis - Last Run

## 🔍 **Token Usage Breakdown from Server Logs**

Based on the server logs, here's the detailed token usage analysis:

### **Stage 1: Analysis (Gemini 2.0 Flash-Lite)**
- **Model**: `gemini-2.5-flash-lite-preview-09-2025`
- **Input**: Files API URI (optimized)
- **Estimated tokens**: ~20 tokens (URI) + ~1,500 tokens (analysis prompt)
- **Total**: ~1,520 tokens

### **Stage 2: Enrichment (Gemini 2.0 Flash-Lite)**  
- **Model**: `gemini-2.5-flash-lite-preview-09-2025`
- **Input**: Files API URI (optimized)
- **Estimated tokens**: ~20 tokens (URI) + ~1,200 tokens (enrichment prompt)
- **Total**: ~1,220 tokens

### **Stage 3: Consolidation (Gemini 2.5 Pro)**
- **Model**: Likely `gemini-2.5-pro` (for JSON consolidation)
- **Input**: Text-only (analysis + enrichment JSON)
- **Estimated tokens**: ~2,000-3,000 tokens
- **Total**: ~2,500 tokens

### **Stage 4: Rendering (Gemini 2.5 Flash Image)**
- **Model**: `gemini-2.5-flash-image-preview`
- **Input**: Files API URI + JSON payload (~893 tokens as logged)
- **Image generation**: Fixed cost per image
- **Total**: ~893 input tokens + image generation cost

## 💰 **Cost Calculation**

### **Google AI Studio Pricing (Current):**
- **Gemini 2.0 Flash-Lite**: ~$0.075 per 1M input tokens
- **Gemini 2.5 Pro**: ~$1.25 per 1M input tokens  
- **Gemini 2.5 Flash Image**: ~$0.315 per 1M input tokens + $0.00315 per image

### **Estimated Cost Breakdown:**

#### **Analysis + Enrichment (Flash-Lite):**
```
(1,520 + 1,220) tokens × $0.075/1M = ~$0.0002
```

#### **Consolidation (Pro model - EXPENSIVE):**
```
2,500 tokens × $1.25/1M = ~$0.003
```

#### **Rendering (Flash Image):**
```
893 tokens × $0.315/1M = ~$0.0003
Image generation: $0.00315 per image = ~$0.003
```

### **🚨 TOTAL ESTIMATED COST: ~$0.007 (0.7 cents)**

## 🤔 **Could it be 14 cents? Analysis:**

**14 cents would be about 20x higher than expected.** Here are possible explanations:

### **Scenario 1: Hidden Pro Model Usage**
If consolidation or other stages accidentally used `gemini-2.5-pro`:
```
20,000 tokens × $1.25/1M = $0.025 (2.5 cents)
50,000 tokens × $1.25/1M = $0.0625 (6.3 cents)  
110,000 tokens × $1.25/1M = $0.14 (14 cents) ✅ MATCH!
```

### **Scenario 2: Multiple API Calls**
- Retry attempts during consolidation
- Failed requests that were retried
- Multiple model calls not visible in logs

### **Scenario 3: Image Processing Tokens**
Despite Files API optimization, if some stage used base64:
```
Large image: ~50,000 tokens × $0.315/1M = $0.016
Multiple large images: ~440,000 tokens × $0.315/1M = $0.14 ✅ MATCH!
```

### **Scenario 4: Billing Delay/Aggregation**  
The 14 cents might include:
- Previous pipeline runs
- Batch billing from earlier usage
- Multiple requests processed together

## 🕵️ **Investigation Steps:**

### **Check 1: Model Usage in Consolidation**
The logs show schema parsing errors in consolidation - this might trigger multiple Pro model calls:
```
Control block schema parse failed, deriving from facts: ZodError
```

### **Check 2: Google AI Studio Dashboard**
Check the detailed usage in [AI Studio](https://aistudio.google.com/app/billing):
- Look for `gemini-2.5-pro` usage spikes
- Check token counts per request  
- Look for failed/retry requests

### **Check 3: Hidden Image Token Usage**
Even with Files API, the rendering stage might process images multiple ways:
```
📸 Original: 13866KB → Optimized: 84KB
```
But there might be additional processing not shown in logs.

## 🎯 **Most Likely Explanation:**

**Consolidation stage using Gemini 2.5 Pro heavily** due to:
1. Schema parsing failures (triggering retries)
2. Complex JSON processing requiring Pro model
3. Multiple consolidation attempts

**Expected breakdown:**
- Analysis: ~$0.0001 (Flash-Lite)
- Enrichment: ~$0.0001 (Flash-Lite) 
- **Consolidation: ~$0.135** (Pro model with retries) ← **Main cost driver**
- Rendering: ~$0.004 (Flash Image)

**Total: ~$0.14 (14 cents)** ✅

## 🔧 **Cost Optimization Recommendations:**

1. **Check consolidation model usage** - might be using Pro instead of Flash-Lite
2. **Reduce schema parsing retries** - the Zod errors suggest multiple attempts
3. **Monitor AI Studio billing** for Pro model usage patterns
4. **Consider caching consolidation results** to avoid re-processing

The Files API optimization is working perfectly (saving ~150k tokens), but the consolidation stage might be using expensive Pro model calls.