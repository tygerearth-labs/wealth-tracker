import { NextRequest, NextResponse } from 'next/server';

// Get client IP address
export async function GET(request: NextRequest) {
  try {
    // Try to get IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    let ipAddress = '';

    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, get the first one
      ipAddress = forwarded.split(',')[0].trim();
    } else if (realIp) {
      ipAddress = realIp;
    } else if (cfConnectingIp) {
      ipAddress = cfConnectingIp;
    } else {
      // Fallback to connection remote address
      ipAddress = request.headers.get('x-vercel-client-ip') || '';
    }

    // If still no IP, return localhost for development
    if (!ipAddress) {
      ipAddress = '127.0.0.1';
    }

    return NextResponse.json({ ipAddress });
  } catch (error) {
    console.error('Error getting IP address:', error);
    return NextResponse.json(
      { error: 'Failed to get IP address' },
      { status: 500 }
    );
  }
}
