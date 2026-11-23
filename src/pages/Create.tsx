import type { FormEvent, ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Address } from '@ton/core';
import { Cloth, Drips, Splatter, SprayCan } from '../components/Brand';
import { IconBack, IconLink, IconRocket, IconSparkle, IconTelegram, IconUpload } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import {
  buildCreateTokenBody,
  computeJettonAddress,
  CREATE_GAS,
  formatTon,
  getFactoryAddress,
  LAUNCH_FEE,
  MAX_INITIAL_BUY,
  MIN_TRADE,
  parseAmount,
  quoteBuy,
  formatTokens,
  randomSalt,
} from '../lib/contracts';
import { CONFIG, isConfigured, friendlyAddress } from '../lib/config';
import { fetchImageGenInfo, generateTokenImage, type ImageGenInfo } from '../lib/imageApi';
import { waitForToken } from '../lib/launchpadApi';
import { buildOnchainContent, METADATA_LIMITS, validateMetadata } from '../lib/metadata';
import styles from './Create.module.css';

type Phase = 'idle' | 'signing' | 'confirming';

export function Create() {
  const { showToast } = useToast();
  const { connected, connect, sendTransaction, address } = useWallet();
  const { token: authToken } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [initialBuy, setInitialBuy] = useState('0');
  const [imageUri, setImageUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadAvailable, setUploadAvailable] = useState(false);
  const [imageGen, setImageGen] = useState<ImageGenInfo | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [genModel, setGenModel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genLeft, setGenLeft] = useState<number | null>(null);
  // The image URL whose preview did not load; another URL gets a fresh chance.
  const [failedPreview, setFailedPreview] = useState('');

  // Only offer file upload and the AI generator when the server has them configured.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((h: { imageUploadConfigured?: boolean } | null) => {
        if (!cancelled) setUploadAvailable(Boolean(h?.imageUploadConfigured));
      })
      .catch(() => {});
    void fetchImageGenInfo().then((info) => {
      if (cancelled || !info) return;
      setImageGen(info);
      setGenModel(info.models[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [phase, setPhase] = useState<Phase>('idle');

  const initialBuyTon = parseAmount(initialBuy || '0');
  const initialBuyError =
    initialBuyTon === null
      ? 'Enter a number like 1.5'
      : initialBuyTon > MAX_INITIAL_BUY
        ? `Initial buy is capped at ${formatTon(MAX_INITIAL_BUY)} TON`
        : initialBuyTon > 0n && initialBuyTon < MIN_TRADE
          ? `Minimum buy is ${formatTon(MIN_TRADE)} TON`
          : null;
  const initialQuote = initialBuyTon && !initialBuyError ? quoteBuy(initialBuyTon) : null;

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!authToken) {
      showToast('Open the app in Telegram to upload, or paste an image URL');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image max 2MB');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/metadata/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': file.type },
        body: file,
      });
      if (res.ok) {
        const { uri } = (await res.json()) as { uri: string };
        setImageUri(uri);
      } else if (res.status === 429) {
        showToast('Upload limit for today reached, paste an image URL instead');
      } else if (res.status === 415) {
        showToast('Use a PNG, JPEG, WebP or GIF image');
      } else {
        showToast(res.status === 503 ? 'Upload unavailable, paste an image URL instead' : 'Image upload failed');
      }
    } catch {
      showToast('Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerate() {
    // Enter in the description field comes here too, so the button's own guard is repeated.
    if (generating || uploading) return;
    if (!authToken) {
      showToast('Open the app in Telegram to generate an image');
      return;
    }
    const prompt = genPrompt.trim();
    if (prompt.length < 3) {
      showToast('Describe the image first, e.g. "a golden rocket dog"');
      return;
    }
    setGenerating(true);
    const result = await generateTokenImage(authToken, prompt, genModel || undefined);
    setGenerating(false);
    if (result.status === 'ok') {
      setImageUri(result.uri);
      setGenLeft(result.remaining);
    } else {
      showToast(result.message);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const meta = {
      name,
      symbol: ticker,
      description,
      image: imageUri.trim(),
      telegram: telegramLink.trim() || undefined,
    };
    const problems = validateMetadata(meta);
    if (problems.length > 0) {
      showToast(problems[0]);
      return;
    }
    if (initialBuyError || initialBuyTon === null) {
      showToast(initialBuyError ?? 'Invalid initial buy');
      return;
    }
    if (!connected || !address) {
      connect();
      return;
    }
    const factory = getFactoryAddress();
    if (!factory) {
      showToast('Launches open once the factory contract is deployed');
      return;
    }

    const salt = randomSalt();
    const creator = Address.parse(address);
    const jettonAddress = await computeJettonAddress(factory, creator, salt);
    const body = buildCreateTokenBody({ salt, content: buildOnchainContent(meta), initialBuyTon });

    setPhase('signing');
    try {
      await sendTransaction({
        to: friendlyAddress(factory),
        amount: (LAUNCH_FEE + initialBuyTon + CREATE_GAS).toString(),
        payload: body.toBoc().toString('base64'),
      });
    } catch (err) {
      setPhase('idle');
      showToast(err instanceof Error && /reject|cancel/i.test(err.message) ? 'Transaction cancelled' : 'Wallet did not send the transaction');
      return;
    }

    setPhase('confirming');
    showToast('Sent. Waiting for the token to appear on-chain…');
    const id = friendlyAddress(jettonAddress);
    const confirmed = await waitForToken(id, () => true);
    setPhase('idle');
    if (confirmed) {
      showToast(`${meta.symbol} is live`);
      navigate(`/token/${id}`);
    } else {
      // The token page keeps looking for the token for a while and says the launch is not confirmed yet.
      showToast('Launch not confirmed yet. Check your wallet history before launching again.');
      navigate(`/token/${id}`, { state: { launched: true } });
    }
  }

  const busy = phase !== 'idle';

  return (
    <div className={`page page--no-nav ${styles.page}`}>
      <Cloth corner="right" />
      <Link to="/" className={styles.back} aria-label="Back">
        <IconBack size={22} />
      </Link>
      <header className={styles.head}>
        <h1 className={styles.title}>
          <span className={styles.titleWhite}>Creator</span>{' '}
          <span className={styles.titleBlue}>
            Studio
            <Drips className={styles.titleDrips} />
          </span>
        </h1>
        <Splatter className={styles.splatter} />
        <SprayCan size={58} className={styles.can} />
      </header>
      <p className={styles.subtitle}>Launch a new meme-coin on the TON bonding curve.</p>

      <form onSubmit={submit} className={styles.form}>
        <div className={styles.pair}>
        <label>
          <span className="field-label">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Super Doge" maxLength={METADATA_LIMITS.name} />
        </label>
        <label>
          <span className="field-label">Ticker</span>
          <input className="input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. SDOGE" maxLength={METADATA_LIMITS.symbol} />
        </label>
        </div>
        <label>
          <span className="field-label">Description</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the meme?" maxLength={METADATA_LIMITS.description} />
        </label>
        <label>
          <span className="field-label">Telegram link (optional)</span>
          <span className={styles.iconInput}>
            <IconTelegram size={18} />
            <input className="input" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} placeholder="https://t.me/yourchannel" />
          </span>
        </label>
        <label>
          <span className="field-label">Token image URL (https)</span>
          <span className={styles.iconInput}>
            <IconLink size={17} />
            <input className="input" value={imageUri} onChange={(e) => setImageUri(e.target.value)} placeholder="https://…/logo.png" maxLength={METADATA_LIMITS.url} />
          </span>
        </label>
        {uploadAvailable && (
          <div>
            <span className="field-label">…or upload an image</span>
            <label className={`${styles.drop}${uploading || generating ? ` ${styles.dropBusy}` : ''}`}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImage}
                disabled={uploading || generating}
                className="sr-only"
              />
              <IconUpload size={26} />
              <span className={styles.dropText}>
                <strong>{uploading ? 'Uploading…' : 'Tap to upload'}</strong>
                <span>PNG, JPG, WebP, GIF (max 2 MB)</span>
              </span>
            </label>
          </div>
        )}
        {imageGen && (
          <div className={`card ${styles.aiCard}`}>
            <span className={styles.aiLabel}>
              …or generate one with AI, free ({genLeft ?? imageGen.userDailyLimit} left today)
            </span>
            <input
              className="input"
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              placeholder="e.g. a golden rocket dog, cartoon style"
              maxLength={imageGen.promptMax}
              aria-label="Describe the image"
              onKeyDown={(e) => {
                // Enter here makes an image; it must not submit the launch form.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!generating) void handleGenerate();
                }
              }}
            />
            <div className={styles.aiRow}>
              {imageGen.models.length > 1 && (
                <select className="input" value={genModel} onChange={(e) => setGenModel(e.target.value)} aria-label="Image model" style={{ flex: 1 }} disabled={generating}>
                  {imageGen.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className={`btn-primary ${styles.genBtn}`}
                onClick={handleGenerate}
                disabled={generating || uploading || genLeft === 0}
              >
                <IconSparkle size={16} />
                {generating ? 'Generating… (up to a minute)' : 'Generate image'}
              </button>
            </div>
          </div>
        )}
        {imageUri.trim().startsWith('https://') && imageUri.trim() !== failedPreview && (
          <img
            src={imageUri.trim()}
            alt="Token image preview"
            width={96}
            height={96}
            className={styles.preview}
            referrerPolicy="no-referrer"
            onError={() => setFailedPreview(imageUri.trim())}
          />
        )}
        <label>
          <span className="field-label">Initial buy (TON, 0–{formatTon(MAX_INITIAL_BUY)})</span>
          <input className="input" value={initialBuy} onChange={(e) => setInitialBuy(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="0" />
          {initialBuyError && <span className="negative" style={{ fontSize: 12 }}>{initialBuyError}</span>}
          {initialQuote && initialQuote.tokensOut > 0n && (
            <span className="muted" style={{ fontSize: 12 }}>You receive ≈ {formatTokens(initialQuote.tokensOut)} {ticker || 'tokens'}</span>
          )}
        </label>

        <div className={`card ${styles.fees}`}>
          <div>
            <span>Launch fee</span>
            <span>{CONFIG.launchFee} TON</span>
          </div>
          <div>
            <span>Network fee (unused part refunded)</span>
            <span>{formatTon(CREATE_GAS)} TON</span>
          </div>
          <div>
            <span>Trading fee</span>
            <span>{CONFIG.tradeFeePercent}% ({CONFIG.creatorFeeShare}/{CONFIG.platformFeeShare})</span>
          </div>
          <div>
            <span>Graduation</span>
            <span>{CONFIG.graduationTarget.toLocaleString('en-US')} TON → STON.fi</span>
          </div>
        </div>

        <button type="submit" className={`btn-primary ${styles.launch}`} disabled={busy || uploading || generating || !isConfigured()}>
          <IconRocket size={20} />
          {phase === 'signing' ? 'Confirm in your wallet…' : phase === 'confirming' ? 'Waiting for confirmation…' : connected ? 'Launch token' : 'Connect wallet to launch'}
        </button>
      </form>

      {!isConfigured() && (
        <p className="muted" style={{ fontSize: 12 }}>
          Launches open once the factory contract is deployed.
        </p>
      )}
    </div>
  );
}
