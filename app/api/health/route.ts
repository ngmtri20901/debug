import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    // For example: database connectivity, external service checks, etc.
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'frontend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        server: 'operational',
        // Add more checks as needed
        // database: await checkDatabase(),
        // externalServices: await checkExternalServices(),
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'frontend',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
} 