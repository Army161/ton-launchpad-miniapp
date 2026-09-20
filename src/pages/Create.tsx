import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconBack } from '../components/Icons';
import { useToast } from '../context/ToastContext';

export function Create() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) { showToast('Name and ticker are required'); return; }
    showToast(`Token "${ticker.toUpperCase()}" created (demo) -- no mainnet tx`);
    navigate('/');
  }

  return (
    <div className="page page--no-nav" style={{ gap: 16 }}>
      <Link to="/" className="btn-ghost" style={{ alignSelf: 'flex-start' }}><IconBack size={14} /> Back</Link>
      <h1>Create token</h1>
      <p className="muted">Launch a new meme-coin on the TON bonding curve.</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <label><span className="muted" style={{ fontSize: 13 }}>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Super Doge" maxLength={32} /></label>
        <label><span className="muted" style={{ fontSize: 13 }}>Ticker</span><input className="input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="e.g. SDOGE" maxLength={10} /></label>
        <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Launch token (demo)</button>
      </form>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Sandbox UI -- no wallet keys, no mainnet transactions.</p>
    </div>
  );
}
