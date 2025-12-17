/**
 * Sofia OAuth API - Cloudflare Workers
 *
 * Handles secure token exchange for OAuth providers.
 * Secrets are stored in Cloudflare environment variables.
 *
 * Endpoints:
 * - POST /auth/youtube/token - Exchange YouTube auth code for tokens
 * - POST /auth/discord/token - Exchange Discord auth code for tokens
 * - POST /auth/spotify/token - Exchange Spotify auth code for tokens
 */

export interface Env {
  // YouTube/Google OAuth
  YOUTUBE_CLIENT_ID: string;
  YOUTUBE_CLIENT_SECRET: string;

  // Discord OAuth
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;

  // Spotify OAuth
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;

  // Allowed origins
  ALLOWED_ORIGINS: string;
}

// CORS headers helper
function corsHeaders(origin: string, allowedOrigins: string): HeadersInit {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  const isAllowed = origins.includes(origin) || origins.includes('*');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : origins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle CORS preflight
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
  });
}

// JSON response helper
function jsonResponse(data: object, status: number, origin: string, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, env.ALLOWED_ORIGINS),
    },
  });
}

// ============= YOUTUBE TOKEN EXCHANGE =============

async function handleYouTubeToken(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const body = await request.json() as { code: string; redirect_uri: string };
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return jsonResponse({ error: 'Missing code or redirect_uri' }, 400, origin, env);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[YouTube Token] Exchange failed:', data);
      return jsonResponse({ error: 'Token exchange failed', details: data }, response.status, origin, env);
    }

    return jsonResponse(data, 200, origin, env);
  } catch (error) {
    console.error('[YouTube Token] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, origin, env);
  }
}

// ============= DISCORD TOKEN EXCHANGE =============

async function handleDiscordToken(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const body = await request.json() as { code: string; redirect_uri: string };
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return jsonResponse({ error: 'Missing code or redirect_uri' }, 400, origin, env);
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Discord Token] Exchange failed:', data);
      return jsonResponse({ error: 'Token exchange failed', details: data }, response.status, origin, env);
    }

    return jsonResponse(data, 200, origin, env);
  } catch (error) {
    console.error('[Discord Token] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, origin, env);
  }
}

// ============= SPOTIFY TOKEN EXCHANGE =============

async function handleSpotifyToken(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const body = await request.json() as { code: string; redirect_uri: string };
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return jsonResponse({ error: 'Missing code or redirect_uri' }, 400, origin, env);
    }

    // Spotify uses Basic Auth with client_id:client_secret
    const credentials = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Spotify Token] Exchange failed:', data);
      return jsonResponse({ error: 'Token exchange failed', details: data }, response.status, origin, env);
    }

    return jsonResponse(data, 200, origin, env);
  } catch (error) {
    console.error('[Spotify Token] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, origin, env);
  }
}

// ============= MAIN ROUTER =============

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // Route requests
    if (method === 'POST') {
      switch (path) {
        case '/auth/youtube/token':
          return handleYouTubeToken(request, env, origin);
        case '/auth/discord/token':
          return handleDiscordToken(request, env, origin);
        case '/auth/spotify/token':
          return handleSpotifyToken(request, env, origin);
      }
    }

    // Health check
    if (method === 'GET' && path === '/health') {
      return jsonResponse({ status: 'ok', timestamp: Date.now() }, 200, origin, env);
    }

    // 404 for unknown routes
    return jsonResponse({ error: 'Not found' }, 404, origin, env);
  },
};
