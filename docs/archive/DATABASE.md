# DATABASE.md — Data Store Schema

## V1 approach

File-based JSON store via Vercel KV or local JSON for dev (`api/data/users.json`, `api/data/tokens.json`).

## Users table

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  telegram_id   BIGINT UNIQUE NOT NULL,
  username      TEXT,
  first_name    TEXT,
  wallet_address TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## Tokens index (off-chain cache)

```sql
CREATE TABLE tokens (
  id              SERIAL PRIMARY KEY,
  jetton_address  TEXT UNIQUE NOT NULL,
  curve_address   TEXT NOT NULL,
  creator_wallet  TEXT NOT NULL,
  name            TEXT NOT NULL,
  symbol          TEXT NOT NULL,
  image_uri       TEXT,
  telegram_link   TEXT,
  raised_ton      NUMERIC DEFAULT 0,
  graduated       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

## Vercel KV keys (alternative)

- `user:{telegram_id}` → JSON user record
- `wallet:{address}` → telegram_id
- `token:{jetton_address}` → JSON token metadata

## TODO

- [ ] Migrate to Vercel Postgres when volume warrants
- [ ] Add indexer worker for factory events
