import { NextRequest, NextResponse } from 'next/server';
import { configureAiStudioEnhanced, getFilesApiStats, cleanupFilesApi } from '@/lib/ghost/ai-studio-enhanced';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    const sessionId = searchParams.get('sessionId');
    const maxAgeHours = searchParams.get('maxAgeHours');

    // Configure the enhanced AI Studio if not already done
    if (process.env.GEMINI_API_KEY) {
      configureAiStudioEnhanced(process.env.GEMINI_API_KEY);
    } else {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    switch (action) {
      case 'stats':
        const stats = await getFilesApiStats();
        return NextResponse.json({
          action: 'stats',
          timestamp: new Date().toISOString(),
          data: stats
        });

      case 'cleanup':
        const cleanupOptions: { maxAgeHours?: number; sessionId?: string } = {};
        if (sessionId) cleanupOptions.sessionId = sessionId;
        if (maxAgeHours) cleanupOptions.maxAgeHours = parseInt(maxAgeHours);

        const cleanupResult = await cleanupFilesApi(cleanupOptions);
        return NextResponse.json({
          action: 'cleanup',
          timestamp: new Date().toISOString(),
          data: cleanupResult,
          options: cleanupOptions
        });

      case 'health':
        return NextResponse.json({
          action: 'health',
          timestamp: new Date().toISOString(),
          status: 'healthy',
          features: {
            enhanced_files_manager: true,
            auto_cleanup: true,
            content_deduplication: true,
            persistent_cache: true,
            storage_stats: true
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['stats', 'cleanup', 'health']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Files API test endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...options } = body;

    // Configure the enhanced AI Studio if not already done
    if (process.env.GEMINI_API_KEY) {
      configureAiStudioEnhanced(process.env.GEMINI_API_KEY);
    } else {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    switch (action) {
      case 'cleanup':
        const cleanupResult = await cleanupFilesApi(options);
        return NextResponse.json({
          action: 'cleanup',
          timestamp: new Date().toISOString(),
          data: cleanupResult,
          options
        });

      case 'test-upload':
        // This would be for testing purposes only
        return NextResponse.json({
          error: 'Direct upload testing not implemented in this endpoint',
          suggestion: 'Use the main /api/ghost endpoint to test uploads during processing'
        }, { status: 400 });

      default:
        return NextResponse.json({
          error: 'Invalid POST action',
          validActions: ['cleanup']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Files API test POST error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}