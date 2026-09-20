import type { FormEvent, ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toNano } from '@ton/core';
import { IconBack } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWallet } from '../context/WalletContext';
import {
  buildCreateTokenBody,
  getFactoryAddress,
  LAUNCH_FEE,
} from '../lib/contracts';
import { CONFIG, isConfigured } from '../lib/config';
import { registerToken } from '../lib/tonapi';

export function Create() {
  const { showToast } = useToast();
  const { connected, connect, sendTransaction, address } = useWallet();
  const { token: authToken } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [initialBuy, setInitialBuy] = useState('0');
  const [imageUri, setImageUri] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image max 2MB');
      return;
    }
    const res = await fetch('/api/metadata/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': file.type },
      body: file,
    });
    if (res.ok) {
      const { uri } = (await res.json()) as { uri: string };
      setImageUri(uri);
    } else {
      showToast('Image upload failed');
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) {
      showToast('Name and ticker are required');
      return;
    }
    if (!connected) {
      connect();
      return;
    }

    const factory = getFactoryAddress();
    if (!factory) {
      showToast('Factory not deployed yet — set VITE_FACTORY_ADDRESS');
      return;
    }

    const initialBuyTon = toNano(initialBuy || '0');
    const totalValue = LAUNCH_FEE + initialBuyTon + toNano('0.15');

    setSubmitting(true);
    try {
      const body = buildCreateTokenBody({
        name: name.trim(),
        symbol: ticker.trim().toUpperCase(),
        imageUri: imageUri || `https://ton.org/download/ton_symbol.png`,
        description: description.trim(),
        telegramLink: telegramLink.trim(),
        initialBuyTon,
      });

      const result = await sendTransaction({
        to: factory.toString(),
        amount: totalValue.toString(),
        payload: body.toBoc().toString('base64'),
      });

      showToast('Token launch submitted!');

      // Register in index (curve address resolved after indexer — placeholder)
      if (authToken && address) {
        await registerToken(
          {
            jettonAddress: `pending_${Date.now()}`,
            curveAddress: `pending_${Date.now()}`,
            creator: address,
            name: name.trim(),
            symbol: ticker.trim().toUpperCase(),
            raisedTon: parseFloat(initialBuy) || 0,
            graduated: false,
            progressBps: 0,
          },
          authToken,
        );
      }

      navigate('/');
      void result;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--no-nav" style={{ gap: 16 }}>
      <Link to="/" className="btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <IconBack size={14} /> Back
      </Link>
      <h1>Creator Studio</h1>
      <p className="muted">Launch a new meme-coin on the TON bonding curve.</p>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Super Doge" maxLength={32} />
        </label>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Ticker</span>
          <input className="input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="e.g. SDOGE" maxLength={10} />
        </label>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Description</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's the meme?" maxLength={200} />
        </label>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Telegram link</span>
          <input className="input" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} placeholder="https://t.me/yourchannel" />
        </label>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Token image</span>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ marginTop: 4 }} />
        </label>
        <label>
          <span className="muted" style={{ fontSize: 13 }}>Initial buy (TON, 0–100)</span>
          <input className="input" value={initialBuy} onChange={(e) => setInitialBuy(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="0" />
        </label>

        <div className="card" style={{ padding: 12, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Launch fee</span>
            <span>{CONFIG.launchFee} TON</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="muted">Trading fee</span>
            <span>{CONFIG.tradeFeePercent}% ({CONFIG.creatorFeeShare}/{CONFIG.platformFeeShare})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="muted">Graduation</span>
            <span>{CONFIG.graduationTarget} TON → STON.fi</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={submitting || !isConfigured()}>
          {submitting ? 'Launching...' : connected ? 'Launch token' : 'Connect wallet to launch'}
        </button>
      </form>

      {!isConfigured() && (
        <p className="muted" style={{ fontSize: 12 }}>
          Factory contract pending deploy. Set VITE_FACTORY_ADDRESS after mainnet deploy.
        </p>
      )}
    </div>
  );
}
