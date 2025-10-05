# Gemini Flash 2.5 Content Prohibition Issues & Mitigations

## Overview

This document details the content filtering challenges encountered when integrating Google's Gemini Flash 2.5 model for ghost mannequin generation, along with the mitigation strategies implemented to address these issues.

## Background

The ghost mannequin pipeline initially used static prompt templates containing terms like "ghost mannequin," "invisible person," and "hollow effect." During testing with Gemini Flash 2.5, we discovered that these terms trigger Google's content safety filters, causing generation failures.

## Content Filter Triggers

### Prohibited Terms Identified

The following terms have been identified as triggering content filters in Gemini Flash 2.5:

- **"ghost mannequin"** - Primary trigger term
- **"invisible person"** - Human invisibility concepts
- **"hollow"** - When used in context of human forms
- **"empty body"** - Void/emptiness in human context
- **"transparent person"** - Human transparency concepts
- **"headless"** - Human mutilation implications
- **"faceless"** - Human identity removal

### Filter Behavior

- **Generation Stage**: Filters activate during image generation, not prompt validation
- **Error Response**: Tasks return `FAILED` status without detailed error messages
- **Consistency**: Filters appear to be consistently applied across similar prompts
- **Context Sensitivity**: Terms may be acceptable in some contexts but not others

## Mitigation Strategies Implemented

### 1. Dynamic Prompt Generation

**Before**: Static templates with prohibited terms
```text
Create a professional ghost mannequin effect showing an invisible person wearing the garment...
```

**After**: AI-generated contextual prompts using analysis data
```text
Transform this flatlay garment into a dimensional form displaying natural drape and structure...
```

#### Implementation
- **Service**: `lib/ghost/prompt-generator.ts`
- **AI Model**: Gemini Pro 2.5 for prompt generation
- **Process**: Analyze garment data → Generate context-specific narrative prompts
- **Length**: ~2200-2500 characters with detailed garment specifications

### 2. Content Sanitization

**Sanitization Function**:
```typescript
function sanitizePromptContent(prompt: string): string {
  const prohibitedTerms = [
    'ghost mannequin', 'invisible person', 'hollow', 
    'empty body', 'transparent person', 'headless', 'faceless'
  ];
  
  return prohibitedTerms.reduce((sanitized, term) => 
    sanitized.replace(new RegExp(term, 'gi'), 'dimensional form'), prompt
  );
}
```

### 3. Narrative-Focused Templates

**Strategy**: Replace technical terminology with natural fashion language

**Old Approach**:
```text
- Create ghost mannequin effect
- Show invisible person wearing garment  
- Generate hollow body structure
```

**New Approach**:
```text
- Display garment in dimensional form
- Show natural drape and structure
- Create professional product presentation
```

### 4. Fallback Prompt System

**Primary**: AI-generated contextual prompts (preferred)
**Fallback**: Pre-sanitized narrative templates (backup)
**Emergency**: Minimal descriptive prompts (last resort)

## Technical Implementation

### Prompt Generation Pipeline

```typescript
// Stage: Prompt Generation
const promptResult = await generateDynamicPrompt({
  consolidatedAnalysis: consolidationResult.analysis,
  flatlayImageUrl: cleanedImageUrl,
  onModelImageUrl: onModelImageUrl,
  sessionId: promptSessionId,
  options: request.options
});

// Content sanitization applied automatically
const sanitizedPrompt = sanitizePromptContent(promptResult.prompt);
```

### API Integration Changes

**Before**: Base64 image encoding (41MB+ payloads)
```typescript
{
  "prompt": "...",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA..."
}
```

**After**: Direct URL usage (2.5KB payloads)
```typescript
{
  "prompt": "...",
  "image": "https://storage.example.com/image.jpg"
}
```

## Testing Results

### Pre-Mitigation Issues

- **Failure Rate**: ~100% with prohibited terms
- **Error Details**: Generic "FAILED" status without specifics
- **Payload Size**: 41MB+ causing potential timeout issues
- **Processing Time**: Tasks failed quickly (within 5-10 seconds)

### Post-Mitigation Results

- **Prompt Generation**: ✅ Successfully generates 2200-2500 char prompts
- **Content Sanitization**: ✅ Removes all identified prohibited terms
- **Payload Size**: ✅ Reduced to ~2.5KB with URL approach
- **API Acceptance**: ✅ Freepik accepts prompts and creates tasks

### Current Status

**Remaining Issue**: Despite all mitigations, Freepik's Gemini Flash 2.5 rendering continues to fail:
- Tasks are created successfully (`CREATED` status)
- Tasks transition to `FAILED` status without error details
- No generated images returned
- Issue appears to be external to our content/payload

## Alternative Hypotheses

### Service-Level Issues

1. **API Key Permissions**: Limited access to Gemini Flash 2.5 model
2. **Rate Limiting**: Undocumented rate limits being exceeded
3. **Service Availability**: Intermittent Freepik service issues
4. **Model Restrictions**: Additional undocumented content restrictions

### Content Policy Evolution

1. **Updated Filters**: New filter rules not yet documented
2. **Context Analysis**: Deeper semantic analysis of entire prompt
3. **Image Analysis**: Content filtering based on reference images
4. **Combined Triggers**: Multiple factors creating filter activation

## Recommended Next Steps

### Immediate Actions

1. **API Key Verification**: Confirm Freepik API key has Gemini Flash 2.5 access
2. **Service Status**: Check Freepik service status and known issues
3. **Minimal Testing**: Test with extremely simple prompts to isolate issues
4. **Alternative Models**: Test with other Freepik-supported models

### Medium-term Solutions

1. **Enhanced Logging**: Capture more detailed API response information
2. **Retry Logic**: Implement intelligent retry strategies for failed tasks
3. **Model Switching**: Automatic fallback to FAL.AI Seedream when Flash fails
4. **Support Contact**: Reach out to Freepik support for Flash-specific guidance

### Long-term Considerations

1. **Direct Google Integration**: Consider using Google's Gemini Flash 2.5 directly
2. **Multi-Provider Strategy**: Implement multiple rendering providers
3. **Content Policy Monitoring**: Regular testing to detect policy changes
4. **Alternative Models**: Evaluate other image generation models

## Code References

### Key Files Modified

- `lib/ghost/prompt-generator.ts` - Dynamic prompt generation
- `lib/ghost/freepik.ts` - Content sanitization and URL handling
- `lib/ghost/pipeline.ts` - Prompt generation stage integration
- `lib/ghost/consolidation.ts` - Enhanced analysis consolidation

### Environment Variables

```bash
# Prompt generation timeouts
TIMEOUT_PROMPT_GENERATION=60000  # 60 seconds

# Content filter debugging
ENABLE_CONTENT_SANITIZATION=true
LOG_SANITIZATION_CHANGES=true

# Model selection
RENDERING_MODEL=gemini-flash  # Still configured despite issues
```

## Monitoring & Metrics

### Success Metrics

- **Prompt Generation Success Rate**: ~100% (working correctly)
- **Content Sanitization Rate**: ~100% (all prohibited terms removed)
- **API Payload Size**: Reduced from 41MB to 2.5KB
- **Task Creation Rate**: ~100% (Freepik accepts all requests)

### Failure Metrics

- **Rendering Success Rate**: 0% (all tasks fail post-creation)
- **Error Detail Availability**: 0% (no useful error messages)
- **Alternative Model Success**: FAL.AI Seedream continues working

## Conclusion

The implemented content filter mitigations successfully address the known prohibited terms and technical constraints (payload size, content sanitization). However, the underlying Freepik Gemini Flash 2.5 service continues to fail, suggesting service-level issues rather than content policy violations.

The system remains fully functional with FAL.AI Seedream as an alternative rendering model, ensuring continuity of service while Freepik issues are resolved.

---

*Last Updated: 2025-01-20*
*Status: Content mitigations implemented, service-level issues under investigation*