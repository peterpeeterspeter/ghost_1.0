import { NextRequest, NextResponse } from 'next/server';
import { testFreepikWithSimplePrompt } from '@/lib/ghost/freepik';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl1, imageUrl2 } = body;

    if (!imageUrl1 || !imageUrl2) {
      return NextResponse.json(
        { error: 'Both imageUrl1 and imageUrl2 are required' },
        { status: 400 }
      );
    }

    console.log('Testing Freepik with URLs:', { imageUrl1, imageUrl2 });

    const result = await testFreepikWithSimplePrompt(imageUrl1, imageUrl2);

    return NextResponse.json({
      success: result.success,
      taskId: result.taskId,
      error: result.error,
      message: result.success ? 'Test completed successfully' : 'Test failed'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with imageUrl1 and imageUrl2 to test Freepik API',
    example: {
      imageUrl1: 'https://v3.fal.media/files/koala/example.jpeg',
      imageUrl2: 'https://v3.fal.media/files/penguin/example.jpeg'
    }
  });
}