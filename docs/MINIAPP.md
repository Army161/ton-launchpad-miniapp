# MINIAPP.md — Telegram Mini App Setup

## BotFather checklist

- [ ] Bot created via `/newbot`
- [ ] Mini App created via `/newapp`
- [ ] Menu button URL → production HTTPS (Vercel or custom domain)
- [ ] App short name, description, photo set
- [ ] `twaReturnUrl` matches `https://t.me/BOT_USERNAME/APP_SHORT_NAME`

## initData auth flow

1. Mini App opens → read `window.Telegram.WebApp.initData`
2. POST to `/api/auth/telegram` with `{ initData }`
3. Server validates HMAC-SHA256 with `TELEGRAM_BOT_TOKEN`
4. Returns JWT session + Telegram user profile

## WebApp SDK init

```ts
Telegram.WebApp.ready();
Telegram.WebApp.expand();
Telegram.WebApp.setHeaderColor('#0B0E11');
Telegram.WebApp.setBackgroundColor('#0B0E11');
```

## Env vars

```
TELEGRAM_BOT_TOKEN=
VITE_TWA_RETURN_URL=https://t.me/YourBot/yourapp
```

## TODO

- [ ] Set actual bot username once confirmed by founder
- [ ] Test initData validation on production URL
