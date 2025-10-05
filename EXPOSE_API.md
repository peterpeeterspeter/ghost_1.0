# 🌐 Expose Your API to Lovable Frontend

## The Problem
Your Lovable frontend at **photostudio.io** cannot access **localhost:8000** because:
- `localhost` is only accessible from your local machine
- External websites cannot make requests to localhost URLs
- This is a browser security restriction

## Quick Solutions

### Option 1: Use ngrok (Recommended - Free)
```bash
# Install ngrok
brew install ngrok

# Expose your API (port 8000) to the internet
ngrok http 8000
```

This will give you a public URL like `https://abc123.ngrok.io` that forwards to your localhost:8000.

**Then update your Lovable frontend to use:**
```javascript
const response = await fetch('https://YOUR-NGROK-URL.ngrok.io/process-ghost', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    garment_url: imageUrl,
    options: { ... }
  })
});
```

### Option 2: Use Cloudflare Tunnel (Free)
```bash
# Install cloudflared
brew install cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:8000
```

### Option 3: Deploy to a Cloud Service

Deploy your API to:
- **Deno Deploy** (Free tier available)
- **Railway** (Free tier)
- **Fly.io** (Free tier)
- **Vercel** (Free tier)

## Current API Status ✅

Your API is working perfectly:
- ✅ Accepts `garment_url` field (Lovable format)
- ✅ CORS enabled for all origins
- ✅ Processes requests successfully
- ✅ Returns proper JSON responses

The only issue is network accessibility from external domains.

## Test Your Setup

Once you have a public URL, test it:

```bash
curl -X POST https://your-public-url/process-ghost \
  -H "Content-Type: application/json" \
  -d '{"garment_url": "https://example.com/image.jpg"}'
```

## Update Frontend

In your Lovable frontend, change the API endpoint from:
```javascript
// ❌ This won't work from external sites
fetch('http://localhost:8000/process-ghost', ...)

// ✅ This will work
fetch('https://your-public-url/process-ghost', ...)
```