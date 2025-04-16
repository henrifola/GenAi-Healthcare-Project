import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID;
    const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;

    if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Fitbit API credentials not configured' },
        { status: 500 }
      );
    }

    // Fitbit API에 토큰 갱신 요청
    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to refresh token', details: errorData },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    
    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}