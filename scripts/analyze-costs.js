#!/usr/bin/env node

/**
 * Cost Analysis Script for Ghost Mannequin Pipeline
 * 
 * This script analyzes potential cost sources that might be causing
 * unexpected billing charges in your AI pipeline.
 */

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class CostAnalyzer {
  constructor(apiKey) {
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.analysis = {
      filesApiUsage: {},
      potentialCostSources: [],
      billingDelayFactors: [],
      recommendations: []
    };
  }

  /**
   * Analyze Files API usage and potential costs
   */
  async analyzeFilesApiCosts() {
    console.log('🔍 Analyzing Files API costs...');
    
    try {
      const response = await this.fileManager.listFiles();
      const files = response.files || [];
      
      // Calculate storage costs
      let totalSizeGB = 0;
      let oldestFile = null;
      let newestFile = null;
      const fileSizes = [];
      
      files.forEach(file => {
        const sizeBytes = parseInt(file.sizeBytes || '0');
        totalSizeGB += sizeBytes / (1024 * 1024 * 1024);
        fileSizes.push(sizeBytes);
        
        const createTime = new Date(file.createTime || '');
        if (!oldestFile || createTime < new Date(oldestFile.createTime)) {
          oldestFile = file;
        }
        if (!newestFile || createTime > new Date(newestFile.createTime)) {
          newestFile = file;
        }
      });
      
      // Storage duration analysis
      const storageSpanDays = oldestFile && newestFile ? 
        Math.ceil((new Date(newestFile.createTime) - new Date(oldestFile.createTime)) / (1000 * 60 * 60 * 24)) : 0;
      
      this.analysis.filesApiUsage = {
        totalFiles: files.length,
        totalSizeGB: totalSizeGB.toFixed(4),
        totalSizeMB: (totalSizeGB * 1024).toFixed(1),
        averageFileSizeMB: files.length > 0 ? ((totalSizeGB * 1024) / files.length).toFixed(2) : 0,
        storageSpanDays,
        oldestFileAge: oldestFile ? Math.ceil((Date.now() - new Date(oldestFile.createTime)) / (1000 * 60 * 60 * 24)) : 0,
        estimatedStorageCostUSD: (totalSizeGB * 0.00001 * storageSpanDays).toFixed(6) // Rough estimate
      };
      
      // Identify potential cost drivers
      if (totalSizeGB > 0.1) { // > 100MB
        this.analysis.potentialCostSources.push({
          source: 'Files API Storage',
          risk: 'HIGH',
          details: `${(totalSizeGB * 1024).toFixed(1)}MB stored for ${storageSpanDays} days`,
          estimatedCost: `~$${(totalSizeGB * 0.00001 * storageSpanDays).toFixed(4)}/day storage`
        });
      }
      
      if (files.length > 50) {
        this.analysis.potentialCostSources.push({
          source: 'Files API Operations',
          risk: 'MEDIUM',
          details: `${files.length} files = many upload/delete operations`,
          estimatedCost: `~$${(files.length * 0.001).toFixed(4)} in operation costs`
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to analyze Files API costs:', error.message);
      this.analysis.potentialCostSources.push({
        source: 'Files API Analysis Failed',
        risk: 'UNKNOWN',
        details: error.message,
        estimatedCost: 'Unable to calculate'
      });
    }
  }

  /**
   * Check for code patterns that might cause hidden costs
   */
  analyzeCodeForCostPatterns() {
    console.log('🔍 Analyzing code for cost-causing patterns...');
    
    const costPatterns = [
      {
        pattern: /gemini-2\.5-pro/gi,
        file: 'Unknown',
        risk: 'CRITICAL',
        description: 'Using expensive Gemini 2.5 Pro model',
        estimatedImpact: '10-20x higher token costs'
      },
      {
        pattern: /gemini-1\.5-pro/gi,
        file: 'Unknown', 
        risk: 'HIGH',
        description: 'Using expensive Gemini 1.5 Pro model',
        estimatedImpact: '5-10x higher token costs'
      },
      {
        pattern: /temperature:\s*[0-9]*\.?[8-9]/gi,
        file: 'Unknown',
        risk: 'LOW',
        description: 'High temperature settings may cause retries',
        estimatedImpact: 'Potential retry costs'
      },
      {
        pattern: /maxRetries.*[5-9]|[1-9][0-9]/gi,
        file: 'Unknown',
        risk: 'MEDIUM',
        description: 'High retry counts can multiply costs',
        estimatedImpact: 'Up to 10x cost multiplication'
      },
      {
        pattern: /data:image\/[^;]+;base64,/gi,
        file: 'Unknown',
        risk: 'HIGH', 
        description: 'Base64 images in prompts = massive token usage',
        estimatedImpact: '50K-200K tokens per image'
      }
    ];
    
    // Check common files for patterns
    const filesToCheck = [
      'lib/ghost/gemini.ts',
      'lib/ghost/ai-studio.ts', 
      'lib/ghost/pipeline.ts',
      'app/api/ghost/route.ts',
      'lib/ghost/freepik.ts'
    ];
    
    filesToCheck.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          costPatterns.forEach(pattern => {
            const matches = content.match(pattern.pattern);
            if (matches) {
              this.analysis.potentialCostSources.push({
                source: `Code Pattern: ${pattern.description}`,
                risk: pattern.risk,
                details: `Found in ${filePath}: "${matches[0]}"`,
                estimatedCost: pattern.estimatedImpact,
                file: filePath,
                matchCount: matches.length
              });
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze ${filePath}:`, error.message);
      }
    });
  }

  /**
   * Analyze potential billing delay factors
   */
  analyzeBillingDelays() {
    console.log('🔍 Analyzing potential billing delays...');
    
    this.analysis.billingDelayFactors = [
      {
        factor: 'Google Cloud Billing Lag',
        description: 'Google typically has 1-3 day billing delays for API usage',
        likelihood: 'VERY HIGH',
        impact: 'Costs from 1-3 days ago showing up now'
      },
      {
        factor: 'Files API Storage Charges', 
        description: 'Storage costs accumulate daily and may not show immediately',
        likelihood: 'HIGH',
        impact: 'Daily storage fees for uploaded files'
      },
      {
        factor: 'Token Usage Batching',
        description: 'Large token usage may be processed/billed in batches',
        likelihood: 'MEDIUM', 
        impact: 'Multiple requests batched into single larger charge'
      },
      {
        factor: 'Failed Request Charges',
        description: 'Partial processing of failed requests may still incur costs',
        likelihood: 'MEDIUM',
        impact: 'Charges for failed but partially processed requests'
      },
      {
        factor: 'Regional Pricing Differences',
        description: 'Different regions may have different pricing tiers',
        likelihood: 'LOW',
        impact: 'Higher rates in certain geographic regions'
      }
    ];
  }

  /**
   * Check recent log files for evidence of high usage
   */
  analyzeRecentActivity() {
    console.log('🔍 Checking for recent high-cost activity...');
    
    // Check for next.js logs or other application logs
    const logPaths = [
      '.next/server/logs',
      'logs',
      '/tmp/ghost-mannequin-logs'
    ];
    
    let recentActivity = {
      foundLogs: false,
      highVolumeActivity: false,
      suspiciousPatterns: []
    };
    
    logPaths.forEach(logPath => {
      try {
        if (fs.existsSync(logPath)) {
          recentActivity.foundLogs = true;
          // In a real implementation, we'd parse logs for patterns
          // For now, just note that logs exist
        }
      } catch (error) {
        // Ignore log access errors
      }
    });
    
    this.analysis.recentActivity = recentActivity;
  }

  /**
   * Generate cost optimization recommendations
   */
  generateRecommendations() {
    console.log('🔍 Generating cost optimization recommendations...');
    
    const recommendations = [
      {
        priority: 'CRITICAL',
        action: 'Switch to cheaper models',
        description: 'Use gemini-2.0-flash-lite instead of Pro models',
        potentialSavings: '80-90% on token costs',
        implementation: 'Update model names in your code'
      },
      {
        priority: 'HIGH', 
        action: 'Implement aggressive Files API cleanup',
        description: 'Delete files immediately after use, not after sessions',
        potentialSavings: '90%+ on storage costs',
        implementation: 'Set cleanup to 1-2 hours instead of 24 hours'
      },
      {
        priority: 'HIGH',
        action: 'Add request logging and monitoring',
        description: 'Log every API call with token usage and costs',
        potentialSavings: 'Cost visibility and spike detection',
        implementation: 'Add detailed logging to all API calls'
      },
      {
        priority: 'MEDIUM',
        action: 'Implement request queuing',
        description: 'Prevent concurrent requests that multiply costs',
        potentialSavings: '50-80% during development',
        implementation: 'Add request queue/throttling'
      },
      {
        priority: 'MEDIUM', 
        action: 'Add cost circuit breakers',
        description: 'Stop processing if costs exceed daily limits',
        potentialSavings: 'Prevents runaway costs',
        implementation: 'Check estimated costs before each API call'
      },
      {
        priority: 'LOW',
        action: 'Optimize image compression',
        description: 'Use more aggressive compression to reduce token usage',
        potentialSavings: '10-20% on token costs',
        implementation: 'Lower quality settings, smaller max dimensions'
      }
    ];
    
    this.analysis.recommendations = recommendations;
  }

  /**
   * Display comprehensive cost analysis
   */
  displayAnalysis() {
    console.log('\n📊 COST ANALYSIS REPORT');
    console.log('=' .repeat(80));
    
    // Files API Usage
    if (this.analysis.filesApiUsage.totalFiles > 0) {
      console.log('\n🗂️  FILES API USAGE:');
      console.log(`   Files: ${this.analysis.filesApiUsage.totalFiles}`);
      console.log(`   Storage: ${this.analysis.filesApiUsage.totalSizeMB}MB (${this.analysis.filesApiUsage.totalSizeGB}GB)`);
      console.log(`   Storage Duration: ${this.analysis.filesApiUsage.storageSpanDays} days`);
      console.log(`   Estimated Storage Cost: $${this.analysis.filesApiUsage.estimatedStorageCostUSD}`);
      console.log(`   Oldest File Age: ${this.analysis.filesApiUsage.oldestFileAge} days`);
    }
    
    // Potential Cost Sources
    if (this.analysis.potentialCostSources.length > 0) {
      console.log('\n⚠️  POTENTIAL COST SOURCES:');
      this.analysis.potentialCostSources.forEach((source, index) => {
        const riskColor = source.risk === 'CRITICAL' ? '🔴' : 
                         source.risk === 'HIGH' ? '🟠' : 
                         source.risk === 'MEDIUM' ? '🟡' : '🟢';
        
        console.log(`\n   ${index + 1}. ${riskColor} ${source.source} (${source.risk} RISK)`);
        console.log(`      Details: ${source.details}`);
        console.log(`      Impact: ${source.estimatedCost}`);
        if (source.file) {
          console.log(`      File: ${source.file}`);
        }
      });
    }
    
    // Billing Delays
    console.log('\n⏰ BILLING DELAY FACTORS:');
    this.analysis.billingDelayFactors.forEach((factor, index) => {
      const likelihoodColor = factor.likelihood === 'VERY HIGH' ? '🔴' :
                             factor.likelihood === 'HIGH' ? '🟠' : 
                             factor.likelihood === 'MEDIUM' ? '🟡' : '🟢';
      
      console.log(`\n   ${index + 1}. ${likelihoodColor} ${factor.factor} (${factor.likelihood} likelihood)`);
      console.log(`      ${factor.description}`);
      console.log(`      Impact: ${factor.impact}`);
    });
    
    // Recommendations
    console.log('\n💡 COST OPTIMIZATION RECOMMENDATIONS:');
    this.analysis.recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'CRITICAL' ? '🔴' :
                           rec.priority === 'HIGH' ? '🟠' :
                           rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      
      console.log(`\n   ${index + 1}. ${priorityColor} ${rec.action} (${rec.priority} PRIORITY)`);
      console.log(`      Description: ${rec.description}`);
      console.log(`      Savings: ${rec.potentialSavings}`);
      console.log(`      How to: ${rec.implementation}`);
    });
    
    // Summary
    console.log('\n📋 EXECUTIVE SUMMARY:');
    const criticalIssues = this.analysis.potentialCostSources.filter(s => s.risk === 'CRITICAL').length;
    const highRiskIssues = this.analysis.potentialCostSources.filter(s => s.risk === 'HIGH').length;
    
    console.log(`   🔴 Critical Cost Issues: ${criticalIssues}`);
    console.log(`   🟠 High Risk Issues: ${highRiskIssues}`);
    console.log(`   📁 Files in Storage: ${this.analysis.filesApiUsage.totalFiles || 0}`);
    console.log(`   💾 Storage Size: ${this.analysis.filesApiUsage.totalSizeMB || 0}MB`);
    
    if (criticalIssues > 0) {
      console.log('\n   🚨 IMMEDIATE ACTION REQUIRED: Critical cost issues detected!');
    } else if (highRiskIssues > 0) {
      console.log('\n   ⚠️  HIGH PRIORITY: Review and fix high-risk cost sources.');
    } else {
      console.log('\n   ✅ No critical cost issues detected. Monitor for billing delays.');
    }
  }

  /**
   * Export detailed analysis to JSON file
   */
  exportAnalysis() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cost-analysis-${timestamp}.json`;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      analysis: this.analysis,
      metadata: {
        version: '1.0',
        generatedBy: 'ghost-mannequin-cost-analyzer'
      }
    };
    
    try {
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`\n📄 Detailed analysis exported to: ${filename}`);
    } catch (error) {
      console.warn(`⚠️ Could not export analysis: ${error.message}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('💰 Ghost Mannequin Pipeline - Cost Analysis');
  console.log('==========================================\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found. Please check your .env.local file.');
    process.exit(1);
  }
  
  const analyzer = new CostAnalyzer(process.env.GEMINI_API_KEY);
  
  try {
    await analyzer.analyzeFilesApiCosts();
    analyzer.analyzeCodeForCostPatterns();
    analyzer.analyzeBillingDelays(); 
    analyzer.analyzeRecentActivity();
    analyzer.generateRecommendations();
    
    analyzer.displayAnalysis();
    analyzer.exportAnalysis();
    
  } catch (error) {
    console.error('\n❌ Cost analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CostAnalyzer };