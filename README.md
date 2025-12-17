# Sofia OAuth API

Cloudflare Workers API for secure OAuth token exchange.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.dev.vars` from example:
```bash
cp .dev.vars.example .dev.vars
```

3. Fill in your OAuth secrets in `.dev.vars`

## Development

```bash
npm run dev
```

API will be available at `http://localhost:8787`

## Deployment

1. Login to Cloudflare:
```bash
npx wrangler login
```

2. Add secrets to Cloudflare:
```bash
npx wrangler secret put YOUTUBE_CLIENT_ID
npx wrangler secret put YOUTUBE_CLIENT_SECRET
npx wrangler secret put DISCORD_CLIENT_ID
npx wrangler secret put DISCORD_CLIENT_SECRET
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put TWITTER_CLIENT_ID
npx wrangler secret put TWITTER_CLIENT_SECRET
```

3. Deploy:
```bash
npm run deploy
```

## Custom Domain

After deploying, configure custom domain in Cloudflare dashboard:
- Go to Workers & Pages > sofia-api > Settings > Triggers
- Add custom domain: `api.sofia.intuition.box`

## Endpoints

### POST /auth/youtube/token
Exchange YouTube authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "redirect_uri": "https://sofia.intuition.box/auth/youtube/callback"
}
```

### POST /auth/discord/token
Exchange Discord authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "redirect_uri": "https://sofia.intuition.box/auth/discord/callback"
}
```

### POST /auth/spotify/token
Exchange Spotify authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "redirect_uri": "https://sofia.intuition.box/auth/spotify/callback"
}
```

### POST /auth/twitter/token
Exchange Twitter/X authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "redirect_uri": "https://sofia.intuition.box/auth/twitter/callback"
}
```

### GET /health
Health check endpoint.
