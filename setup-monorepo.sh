#!/bin/bash

# 🏗️ Ghost Pipeline Platform - Monorepo Setup Script
# This script sets up the monorepo structure for separating the original
# Ghost Mannequin Pipeline from new features while sharing infrastructure.

set -e

echo "🚀 Setting up Ghost Pipeline Platform Monorepo..."

# Create root workspace package.json
cat > package.json << 'EOF'
{
  "name": "ghost-pipeline-platform",
  "version": "1.0.0",
  "description": "AI-powered platform with Ghost Mannequin Pipeline and extensible features",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=packages/ghost-mannequin",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "clean": "npm run clean --workspaces",
    "setup": "./setup-monorepo.sh"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

# Create packages directory structure
mkdir -p packages/{ghost-mannequin,shared,new-feature}
mkdir -p packages/shared/{lib,types}
mkdir -p packages/shared/lib/{ai,image,storage,utils}
mkdir -p packages/ghost-mannequin/{lib,app,types,scripts,docs}
mkdir -p packages/new-feature/{lib,app,types,scripts,docs}
mkdir -p docs/{ghost-mannequin,new-feature,shared}
mkdir -p scripts/monitoring

echo "📁 Created directory structure"

# Create shared package.json
cat > packages/shared/package.json << 'EOF'
{
  "name": "@ghost-platform/shared",
  "version": "1.0.0",
  "description": "Shared infrastructure for Ghost Pipeline Platform",
  "main": "lib/index.ts",
  "types": "lib/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf lib dist"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@fal-ai/client": "^1.0.0",
    "sharp": "^0.34.4",
    "zod": "^3.22.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "typescript": "^5.2.0"
  }
}
EOF

# Create ghost-mannequin package.json
cat > packages/ghost-mannequin/package.json << 'EOF'
{
  "name": "@ghost-platform/ghost-mannequin",
  "version": "1.0.0",
  "description": "Original Ghost Mannequin Pipeline - preserved and optimized",
  "main": "lib/index.ts",
  "types": "lib/index.ts",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next lib dist"
  },
  "dependencies": {
    "@ghost-platform/shared": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0"
  }
}
EOF

# Create new-feature package.json
cat > packages/new-feature/package.json << 'EOF'
{
  "name": "@ghost-platform/new-feature",
  "version": "1.0.0",
  "description": "New feature built on Ghost Pipeline Platform infrastructure",
  "main": "lib/index.ts",
  "types": "lib/index.ts",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next lib dist"
  },
  "dependencies": {
    "@ghost-platform/shared": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.2.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0"
  }
}
EOF

echo "📦 Created package.json files"

# Create shared TypeScript configuration
cat > packages/shared/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib", "dist"]
}
EOF

# Create root TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@ghost-platform/shared": ["./packages/shared/lib"],
      "@ghost-platform/ghost-mannequin": ["./packages/ghost-mannequin/lib"],
      "@ghost-platform/new-feature": ["./packages/new-feature/lib"]
    }
  },
  "include": [
    "packages/*/src/**/*",
    "packages/*/lib/**/*",
    "packages/*/app/**/*",
    "packages/*/types/**/*"
  ],
  "exclude": ["node_modules"]
}
EOF

echo "⚙️ Created TypeScript configurations"

# Create shared infrastructure index
cat > packages/shared/lib/index.ts << 'EOF'
// 🏗️ Ghost Pipeline Platform - Shared Infrastructure
// This module exports all shared components for use across features

// AI Infrastructure
export * from './ai/gemini-client';
export * from './ai/files-manager';
export * from './ai/cost-control';
export * from './ai/model-management';

// Image Processing
export * from './image/optimization';
export * from './image/resizing';
export * from './image/validation';

// Storage Management
export * from './storage/files-api';
export * from './storage/cleanup';
export * from './storage/monitoring';

// Utilities
export * from './utils/errors';
export * from './utils/logging';
export * from './utils/validation';

// Types
export * from '../types/ai';
export * from '../types/image';
export * from '../types/common';
EOF

# Create shared types
cat > packages/shared/types/common.ts << 'EOF'
// 🏗️ Common types shared across the platform

export interface PlatformConfig {
  apiKeys: {
    gemini?: string;
    fal?: string;
    freepik?: string;
  };
  features: {
    filesApiEnabled: boolean;
    costOptimization: boolean;
    monitoring: boolean;
  };
  limits: {
    maxImageSize: number;
    maxProcessingTime: number;
    maxCostPerRequest: number;
  };
}

export interface ProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface FeatureConfig {
  name: string;
  version: string;
  dependencies: string[];
  apiEndpoints: string[];
  sharedComponents: string[];
}
EOF

echo "🔧 Created shared infrastructure"

# Create migration script
cat > migrate-to-monorepo.sh << 'EOF'
#!/bin/bash

# 🔄 Migration script to move existing code to monorepo structure

echo "🔄 Migrating existing code to monorepo structure..."

# Move existing lib/ghost to packages/ghost-mannequin/lib/ghost
if [ -d "lib/ghost" ]; then
  echo "📁 Moving lib/ghost to packages/ghost-mannequin/lib/ghost"
  cp -r lib/ghost packages/ghost-mannequin/lib/
fi

# Move existing app/api/ghost to packages/ghost-mannequin/app/api/ghost
if [ -d "app/api/ghost" ]; then
  echo "📁 Moving app/api/ghost to packages/ghost-mannequin/app/api/ghost"
  cp -r app/api/ghost packages/ghost-mannequin/app/
fi

# Move existing types/ghost.ts to packages/ghost-mannequin/types/
if [ -f "types/ghost.ts" ]; then
  echo "📁 Moving types/ghost.ts to packages/ghost-mannequin/types/"
  cp types/ghost.ts packages/ghost-mannequin/types/
fi

# Move existing scripts to packages/ghost-mannequin/scripts/
if [ -d "scripts" ]; then
  echo "📁 Moving scripts to packages/ghost-mannequin/scripts/"
  cp -r scripts packages/ghost-mannequin/
fi

# Move documentation
if [ -d "docs" ]; then
  echo "📁 Moving docs to packages/ghost-mannequin/docs/"
  cp -r docs packages/ghost-mannequin/
fi

echo "✅ Migration completed!"
echo "📋 Next steps:"
echo "1. Review moved files in packages/ghost-mannequin/"
echo "2. Update import paths in moved files"
echo "3. Test the ghost-mannequin package"
echo "4. Start developing your new feature in packages/new-feature/"
EOF

chmod +x migrate-to-monorepo.sh

echo "📋 Created migration script"

# Create README for the platform
cat > README.md << 'EOF'
# 🏗️ Ghost Pipeline Platform

A modular AI-powered platform built on the optimized Ghost Mannequin Pipeline infrastructure.

## 🎯 Platform Overview

This platform provides:
- **Ghost Mannequin Pipeline**: Original optimized pipeline for professional product photography
- **Extensible Architecture**: Easy to add new AI-powered features
- **Shared Infrastructure**: Cost-optimized AI services, image processing, and storage management
- **Independent Scaling**: Each feature can scale independently

## 📁 Structure

```
ghost-pipeline-platform/
├── packages/
│   ├── ghost-mannequin/          # Original pipeline (preserved)
│   ├── new-feature/              # Your new feature
│   └── shared/                   # Shared infrastructure
├── docs/                         # Platform documentation
└── scripts/                     # Platform utilities
```

## 🚀 Quick Start

### Setup
```bash
# Install dependencies
npm install

# Run migration (moves existing code)
./migrate-to-monorepo.sh

# Start development
npm run dev
```

### Development
```bash
# Work on ghost mannequin pipeline
cd packages/ghost-mannequin
npm run dev

# Work on new feature
cd packages/new-feature
npm run dev
```

## 🧩 Shared Infrastructure

The platform includes optimized shared components:

- **AI Services**: Gemini integration with cost optimization
- **Image Processing**: Sharp-based optimization and resizing
- **Storage Management**: Files API with deduplication
- **Cost Control**: Monitoring and optimization utilities

## 📚 Documentation

- [Ghost Mannequin Pipeline](./docs/ghost-mannequin/) - Original pipeline documentation
- [New Feature](./docs/new-feature/) - Your new feature documentation
- [Shared Infrastructure](./docs/shared/) - Shared components documentation

## 🔧 Configuration

Each package has its own configuration while sharing common infrastructure. See individual package READMEs for specific setup instructions.

## 🚀 Deployment

The platform supports independent deployment of features while sharing infrastructure components.

---

*Built on the optimized Ghost Mannequin Pipeline with 97% cost reduction and enhanced performance.*
EOF

echo "📚 Created platform README"

echo ""
echo "✅ Monorepo setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./migrate-to-monorepo.sh (to move existing code)"
echo "2. Install dependencies: npm install"
echo "3. Test ghost-mannequin: cd packages/ghost-mannequin && npm run dev"
echo "4. Start developing your new feature in packages/new-feature/"
echo ""
echo "🎯 Your new feature will have access to all the optimized infrastructure:"
echo "   - Files API integration (97% token reduction)"
echo "   - Cost-optimized AI models"
echo "   - Image processing with Sharp"
echo "   - Storage management and cleanup"
echo "   - Monitoring and cost controls"
echo ""
echo "🚀 Ready to build something amazing!"

