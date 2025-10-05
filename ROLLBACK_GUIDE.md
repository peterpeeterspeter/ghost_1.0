# Rollback Guide

## 🔄 Quick Rollback to Stable State

If you need to revert to the stable version before new feature development:

### Option 1: Reset to Tagged Version
```bash
# Hard reset to stable dual AI model version
git reset --hard v1.0.0-dual-ai-models

# Force push if needed (be careful in production)
git push origin main --force
```

### Option 2: Create New Branch from Tag
```bash
# Create a new branch from the stable tag
git checkout -b stable-rollback v1.0.0-dual-ai-models

# Switch to main and merge
git checkout main
git merge stable-rollback
```

### Option 3: Cherry-pick Specific Commits
```bash
# View recent commits
git log --oneline -10

# Cherry-pick specific stable commits
git cherry-pick 755709a  # Dual AI model integration
```

## 📊 Stable Version Features (v1.0.0-dual-ai-models)

### ✅ Verified Working Components:
- **4-Stage Pipeline**: Background removal → Analysis → Enrichment → Rendering
- **Dual AI Models**: Gemini Flash 2.5 (default) + Seedream 4.0 (premium)
- **79-Field Analysis**: Complete garment analysis schemas
- **Environment Config**: `RENDERING_MODEL=gemini-flash|seedream`
- **Automatic Fallback**: Model switching on failure
- **Error Handling**: Production-grade error management
- **Documentation**: Complete README and integration guides

### 🏗️ Key Files in Stable State:
- `app/api/ghost/route.ts` - Main API endpoint with model selection
- `lib/ghost/pipeline.ts` - Pipeline orchestrator with dual model support
- `lib/ghost/gemini.ts` - Gemini + Seedream integration
- `lib/ghost/fal.ts` - FAL.AI background removal
- `types/ghost.ts` - Complete TypeScript definitions (79 fields)
- `.env.example` - Environment configuration template

### 🧪 Tested Functionality:
- ✅ Background removal with FAL.AI Bria 2.0
- ✅ Garment analysis with Gemini Pro (37 fields)
- ✅ Enrichment analysis with Gemini Pro (33 fields) 
- ✅ Ghost mannequin rendering with Gemini Flash 2.5
- ✅ Ghost mannequin rendering with Seedream 4.0
- ✅ Automatic fallback between models
- ✅ Configurable timeouts and error handling

## 🚀 Development Workflow

### Before Starting New Features:
1. Ensure you're on stable version: `git tag --list | grep dual-ai`
2. Create feature branch: `git checkout -b feature/new-feature-name`
3. Develop and test new features
4. If issues arise, rollback using commands above

### After Completing Features:
1. Test thoroughly in feature branch
2. Merge to main when stable
3. Create new version tag for next stable checkpoint

## 📋 Rollback Checklist

- [ ] Verify current git status: `git status`
- [ ] Check recent commits: `git log --oneline -5`  
- [ ] Backup any important uncommitted changes
- [ ] Choose appropriate rollback method above
- [ ] Test API endpoints after rollback
- [ ] Verify environment variables are correct
- [ ] Restart development server: `npm run dev`

## 🆘 Emergency Recovery

If something goes wrong during rollback:

```bash
# View all branches and tags
git branch -a
git tag --list

# Force pull from remote
git fetch origin
git reset --hard origin/main

# Or restore specific tag
git checkout v1.0.0-dual-ai-models
git checkout -b recovery-branch
```

---

**Last Updated**: 2025-09-17  
**Stable Version**: v1.0.0-dual-ai-models  
**Commit**: 755709a
