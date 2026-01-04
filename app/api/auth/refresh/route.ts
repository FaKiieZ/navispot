import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
    }

    const newToken = await refreshAccessToken(refreshToken);
    
    if (!newToken) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }

    return NextResponse.json(newToken);
  } catch {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}

interface TokenRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResponse | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
