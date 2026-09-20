# CLOUDFLARE.md — DNS Setup (when domain is ready)

## Prerequisites

- Domain purchased (Namecheap, Cloudflare Registrar, etc.)
- Vercel project deployed

## Steps

### 1. Add site to Cloudflare

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add site → enter your domain
3. Update nameservers at your registrar to Cloudflare's NS records

### 2. DNS records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `launch` | `cname.vercel-dns.com` | Proxied (orange) |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied |

Or use Vercel's exact CNAME from: Vercel Dashboard → Domains → Add.

### 3. Vercel custom domain

1. Vercel → Project → Settings → Domains
2. Add `launch.yourdomain.com`
3. Wait for SSL (automatic)

### 4. Update app config

```bash
# .env.production / Vercel env
VITE_MANIFEST_URL=https://launch.yourdomain.com/tonconnect-manifest.json
VITE_TWA_RETURN_URL=https://t.me/YourBot/yourapp
```

Edit `public/tonconnect-manifest.json`:
```json
{
  "url": "https://launch.yourdomain.com",
  "iconUrl": "https://launch.yourdomain.com/icon-180.png"
}
```

### 5. Security (recommended)

- Enable DNSSEC in Cloudflare
- SSL/TLS mode: **Full (strict)**
- Do **not** enable "Under Attack" mode on manifest path (breaks TON Connect)

### 6. BotFather

Update Mini App URL to `https://launch.yourdomain.com`
