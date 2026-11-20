# DECISIONS.md — architecture decisions

## ADR-001 Retain React + TypeScript + Vite

Reason: existing production architecture, TON Connect compatibility, lower regression risk, faster verified launch.

## ADR-002 Rewrite the contracts on TEP-74 with the minter as the curve (2026-09-22)

The previous contracts refunded the whole contract balance to every buyer, paid TON for forged sell notifications and
never minted tokens. They could not be patched safely. The minter now is the curve, sells are burns verified by
recomputing the seller's wallet address, and the reserve is locked with `nativeReserve`. Economics unchanged.
Consequence: addresses from the old factory (never deployed) are irrelevant; wallets show a sell as a "burn".

## ADR-003 No database for V1

Tokens are discovered from the factory's on-chain transactions and verified by address derivation; sessions are
stateless JWTs. The JSON-file store (ephemeral on Vercel) and the unverified wallet-link endpoint were removed.
Revisit when V1.1 needs history, search or more than the ~100 most recent factory transactions (see STATUS).

## ADR-004 Rounding favours the pool

Fee = ceil(2%); payouts round down. This moves at most a nanoton per trade toward the pool and makes insolvency
through repeated tiny trades impossible (tested). Not an economics change.

## ADR-005 Graduation via a liquidity manager wallet (custodial window) — superseded by ADR-009

On-chain STON.fi seeding from Tact could not be verified in the sandbox. V1 sends graduated liquidity to a liquidity
manager fixed at factory deploy (default: the deployer wallet); the keeper script seeds the STON.fi v2 pool and can
send the LP to the zero address. Trust: between `Migrate` and pool creation the liquidity manager holds the funds.
**Founder decision pending:** confirm the liquidity manager wallet and that LP is locked (SPEC says "locked LP").
V2: trustless on-chain migration.

## ADR-006 Deterministic token addresses from (factory, creator, salt)

The client derives the new token's address before sending, so it can wait for exactly that contract. A reused salt
refunds the creator and changes nothing.

## ADR-007 Operator scripts refuse mainnet without explicit approval

`deploy:mainnet`, `graduate --execute` on mainnet and `launch-production.sh` require `MAINNET_GO_LIVE_APPROVED=yes`,
set only after the founder writes "MAINNET GO-LIVE APPROVED".

## ADR-008 Referral share on buys, funded from the platform share

Decided by the founder on 2026-09-27 (option "Platform share"). A `Buy` may name a `referrer`; it receives 20% of the
trade fee, taken from the platform's 40%, so the split on a referred buy is creator 60 / platform 20 / referrer 20.
The creator's income never changes. Sells, self-referrals and cuts below `REFERRAL_DUST` (0.0005 TON) pay no referrer;
the cut stays with the platform. The threshold comes from sandbox measurements: a fee message costs about
0.00008 TON (forward + receive), so smaller payouts would be mostly gas. Added before the contract freeze because
changing `Buy` after deploy would need a new factory.

## ADR-009 Graduation seeds STON.fi on-chain; LP locked; no custodial window

Decided by the founder on 2026-11-05 (option "Build on-chain"), replacing ADR-005 before any factory deploy.
`Migrate` sends both legs of a STON.fi v2 `provide_lp` from the token contract: the remaining supply is minted to
the router's jetton wallet (`transfer_notification` carries the payload) and the reserve goes through the router's
pTON wallet (`ton_transfer`, op 0x01f3835d). Layouts follow `@ston-fi/sdk` 2.7 (`RouterV2_1`, `PtonV2_1`). The router
and its pTON wallet are fixed at factory deploy (`DexConfig`); the deploy script checks the router is v2
constant-product with pool creation on and that the pTON master maps the router to that pTON wallet.

- LP goes to the zero address, so the pool's liquidity is locked from the moment it exists.
- `min_lp_out` is 99% of a fresh pool's `sqrt(ton × tokens)`. A pool that already holds liquidity at a different
  price mints less, so STON.fi does not add the liquidity: it parks both legs in the liquidity manager's LP account
  on that pool (corrected 2026-11-12 from STON.fi's source; earlier text said "refunds"). ADR-010 makes this case
  unreachable before graduation.
- Refunds and bounced legs go to the liquidity manager, the only remaining trust point, used only on that failure
  path (`graduate.ts --fallback`).
- 0.65 TON of the reserve pays the DEX gas, so the trigger needs only 0.05 TON and anyone can run it.
- The sandbox has no STON.fi contracts, so tests check the exact messages sent; the testnet rehearsal must show a real
  pool with LP at the zero address before mainnet (`docs/VERIFICATION.md`).

## ADR-010 The router's jetton wallet is closed until graduation (router wallet guard)

Decided 2026-11-12, before any factory deploy. Found while checking ADR-009 against STON.fi v2's source: tokens are
transferable during the curve, so anyone could create the token/TON pool on the configured router early, at a
skewed price, for about 1 TON of gas. Every graduation would then miss `min_lp_out` and land in the liquidity
manager's LP account instead of a locked pool. STON.fi only adds a token to a pool from a `transfer_notification`
sent by that token's jetton wallet owned by the router, so that one wallet is the choke point.

- `JettonWallet` takes the token's router as a third init field (it changes every wallet address; clients pass the
  router from `get_curve_state`). The router's own wallet starts with `get_dex_guard() = 0xFFFFFFFF` and refuses
  every incoming transfer ("DEX closed until graduation"); the sender keeps the jettons and gets the TON back.
- The graduation mint from the token contract opens it. For `DEX_LP_GUARD` (600 s) after that it still refuses
  transfers whose payload the router would read as `provide_lp` (first reference, first 32 bits, exactly as the
  router parses it), so nobody can race a deposit into the pool before the curve's own pair is added. Swaps (DEX
  sells) pass at once. Outgoing transfers from the router's wallet are never restricted.
- Every other wallet has guard 0 and behaves as plain TEP-74.
- `DEX_DEADLINE` goes from 15 minutes to 1 day, so a slow network cannot split the two legs (a late leg is refused by
  the router while the other stays in the token contract's LP account, which nobody can empty).
- A wallet bounce now also returns the unspent TON to the owner (a rejected sell used to leave about 0.07 TON in the
  seller's jetton wallet).
- Consequence for operators: the liquidity manager's fallback deposit (`provide_lp` from its own wallet) is refused for
  the first 10 minutes after migration; the graduation tool must wait for `get_dex_guard`.

## ADR-011 The mainnet factory may be deployed from a wallet app

Decided 2026-11-19. The deploy script signs with `DEPLOY_MNEMONIC` from a local file. The founder keeps his wallet
in Tonkeeper, could not do that step, and asked whether to send his recovery phrase in chat. A phrase in a file on a
machine that agents also work on, or in a chat, is a worse risk than anything the script protects against.

- `/deploy-factory` (served only where `VITE_FACTORY_DEPLOY_PAGE=on`) builds the same message as
  `contracts/scripts/deploy.ts`: 0.1 TON, bounceable, to the factory's address, with its state init and an empty
  body. The wallet app shows and signs it over TON Connect, on mainnet only.
- The owner is the connected wallet and, as the founder chose on 2026-11-18, also the liquidity manager. The treasury,
  the STON.fi router and its pTON master and wallet are pinned in `src/lib/factoryDeploy.ts` from the founder's message
  and the mainnet checks of 2026-11-14, and checked when the wallet connects and again right before every send and
  every retry: the pTON master on-chain must name the pinned wallet, and the STON.fi API must describe the router as
  the script requires (v2, type exactly `ConstantProduct`, pool creation on). Only if that API gives no answer at all
  within ten seconds does the page go on without it (its version and type cannot change); an answer that differs
  stops it before the wallet is asked.
- One send at a time. The page records the request in the browser's storage before the wallet opens. Until the wallet
  refuses it, the factory is seen on-chain, or the request's `validUntil` (ten minutes) plus two minutes has passed,
  the page only verifies and offers no second send, also after a reload. A second send would deploy nothing and leave
  another 0.1 TON in the factory.
- After the send the page verifies `get_factory_info` as the script does, and the owner as well.
- The approval rule is unchanged: the page is used only after the testnet gate and "MAINNET GO-LIVE APPROVED"
  (ADR-007). It is not served in Production. Anyone who opens it with another wallet deploys a factory of their own at
  another address, which the app never lists.
- Consequence: no `deployed.mainnet.json` is written; the factory address and transaction go into `docs/STATUS.md`
  and `docs/VERIFICATION.md` by hand.

## ADR-012 Token images: Blob storage, and free AI images through Vercel AI Gateway

Decided 2026-11-19, on the founder's ask for "a real upload and image generator" that makes free images with the
models people know (Gemini Nano Banana, ChatGPT, Grok, Meta AI).

- Storage is one public Vercel Blob store (`launchpad-token-images`, connected to the project). Every stored file is
  named `<kind>/<UTC day>/<owner key>/<uuid>.<ext>` with kind `uploads` or `generated`. The owner key is a keyed hash
  of the Telegram id (HMAC-SHA256 with `JWT_SECRET`, 24 hex characters), not the id itself: the address is public and
  ends up in the token's on-chain metadata next to the creator's wallet (SECURITY #30). The function log ties a
  stored file to its Telegram id. A new `JWT_SECRET` renames the folders, so that day's counts start again.
- The generator is `POST /api/image/generate`. It calls Vercel AI Gateway, one account that serves all four model
  families, so there is one integration and one bill instead of four provider keys. On Vercel the function
  authenticates with the deployment's own OIDC token (the `x-vercel-oidc-token` request header), so no key is stored
  anywhere; `AI_GATEWAY_API_KEY` is read first if someone sets one. Models: `meta/muse-image-1.0`,
  `spacexai/grok-imagine-image`, `openai/gpt-image-1-mini` (medium quality) through the gateway's Images endpoint, and
  `google/gemini-2.5-flash-image` through Chat Completions with image output. `IMAGE_GEN_MODELS` narrows the list.
- "Free" means free for the creator. The platform pays the gateway per image (about 1 to 4 US cents, 2026-11-19
  catalog prices), so the feature is off unless `IMAGE_GENERATION=on` and it is bounded: `IMAGE_GEN_USER_DAILY_LIMIT`
  (default 5) and `IMAGE_GEN_GLOBAL_DAILY_LIMIT` (default 50, at most 1000) per UTC day, one attempt per user every
  8 s. At the defaults the worst case is about 2 USD a day. The hard stop is a budget on the Vercel team's AI Gateway,
  which only the founder can set.
- There is no database (ADR-003), so the limits are counted from the stored files: one Blob `list` of the day's
  folder gives the user's and the global count. Two requests at the same instant can both pass, so a limit can be
  exceeded by the number of parallel requests; the cooldown keeps that small and the gateway budget bounds the money.
  The limits are therefore soft, for uploads too (which have no cooldown). The count and the file use one
  timestamp, so a request that crosses UTC midnight is filed in the day it was counted in.
- What is stored is never the provider's bytes: `sharp` turns them into a 512 px square JPEG (about 50 KB), which
  also proves they are an image. A token logo is shown at 40 to 96 px, and megabyte images would fill the store and
  slow every list.
- The same day folders give uploads a limit (10 per user, 300 for everyone per day), and an uploaded file must start
  with the bytes of the image type it declares. This closes SECURITY #13.
- `GET /api/image/selftest` exists because no tool can call the POST endpoint without a Telegram session. It runs one
  real image through the gateway, sharp and Blob, only on a Vercel preview and only with the key in `IMAGE_SELFTEST`
  (32+ characters); otherwise it answers 404. The key is set only while a check runs.
- Checked 2026-11-19 on a preview: without paid credits AI Gateway serves `spacexai/grok-imagine-image` and
  `openai/gpt-image-1-mini` and answers 403 for the Meta and Gemini models ("Free tier users do not have access to
  this model"). Until the team buys credits, `IMAGE_GEN_MODELS` names those two, so the form offers only what works.
  How many images the free tier allows is not documented where we looked; when it runs out the creator is told to
  upload or paste instead.
- Rejected: a provider key per model (four secrets, four bills); a free third-party image API with no account (no
  control over uptime, content or what happens to prompts); resizing in the browser (the raw image would still have to
  be stored or sent back through the 4.5 MB response limit).
- Consequence: prompts leave the platform (to Vercel and the chosen provider); `public/privacy.html` says so. The
  metadata still only stores an https URL, so the contracts and the token format are unchanged.

## ADR-013 Project links in the token metadata

Decided 2026-11-20, on the founder's ask for website, X, Facebook, Instagram and YouTube links next to the Telegram
link, "only if it's the correct way" and by the standard.

- TEP-64 (the TON token metadata standard) defines `name`, `description`, `image`, `image_data`, `symbol`,
  `decimals`, `amount_style`, `render_type` and `uri`. It has no key for a website or social account (checked
  2026-11-20 against docs.ton.org "Token metadata" and Tonkeeper's `tongo/tep64`). The on-chain format is a dictionary
  keyed by the SHA-256 of each key name, so readers look up the keys they know and never see others. The app already
  stored `telegram` this way.
- So each link is one more optional key in the same dictionary: `website`, `twitter` (X), `telegram`, `youtube`,
  `instagram`, `facebook`. The names follow the common launchpad convention (`twitter`, `telegram`, `website`).
  They are permanent: renaming one would hide the links of every token already launched with it.
- Where they show: on the token page of this app, with a note that the creator added them and the app did not check
  them. Wallets (Tonkeeper) and explorers (Tonviewer) skip unknown keys, so they do not show them; Tonkeeper shows
  socials only for jettons in its curated `ton-assets` list, which is a separate request a project makes to Tonkeeper.
- Each link must be https, at most 256 characters, without a user:password part, and, except the website, on that
  platform's own domain (or its `www.`/`m.` form; Telegram stays exactly `t.me`). The API applies the same check when
  it reads a token, because a launch made outside the app can store anything (SECURITY #31).
- Contracts unchanged: the factory and the token store the content cell as given. The sandbox test "launches with the
  largest metadata the Create page allows" launches a token with every field at its limit (about 2.3 KB in 42 cells,
  against about 0.2 KB before), checks the content, the initial buy, a later buy and solvency, and that the creator's
  cost stays within the existing gas. Cost: bigger forward fees at launch (inside `CREATE_GAS`) and storage rent on the
  token contract of up to about 0.02 TON a year at the maximum size (about 0.005 before), from the contract's own
  balance.
- Rejected: an off-chain JSON file (`uri`) with `social`/`websites` arrays, which some indexers read. It needs a host
  that stays up forever, and the token would then depend on that host; on-chain keys keep the token self-contained.

