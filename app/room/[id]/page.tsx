"use client";
import { useState, useEffect, useRef } from 'react';
export default function Room({ params }: { params: { id: string } }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState('');
  const [provider, setProvider] = useState('google');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('totp');
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(`wss://authroom.devdynamo713.com/room/${params.id}/ws`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'session') {
        setSessions(prev => [...prev, data.data]);
      }
    };
    wsRef.current = ws;
    const poll = setInterval(async () => {
      const res = await fetch(`https://authroom.devdynamo713.com/room/${params.id}/sessions`);
      if (res.ok) setSessions(await res.json());
    }, 3000);
    return () => { ws.close(); clearInterval(poll); };
  }, [params.id]);
  const addSession = async () => {
    const data = { user, provider, mfaEnabled, mfaMethod: mfaEnabled ? mfaMethod : undefined };
    await fetch(`https://authroom.devdynamo713.com/room/${params.id}/session`, { method: 'POST', body: JSON.stringify(data) });
    setUser(''); setMfaEnabled(false);
  };
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#0a0a0a', color: '#e5e5e5', minHeight: '100vh' }}>
      <h1>AuthRoom: {params.id}</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="user" className="user-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }} />
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="provider-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }}>
          <option value="google">google</option>
          <option value="github">github</option>
          <option value="microsoft">microsoft</option>
          <option value="okta">okta</option>
          <option value="custom">custom</option>
        </select>
        <label style={{ color: '#a1a1aa', fontSize: 13 }}>
          <input type="checkbox" checked={mfaEnabled} onChange={(e) => setMfaEnabled(e.target.checked)} className="mfa-check" /> MFA
        </label>
        {mfaEnabled && (
          <select value={mfaMethod} onChange={(e) => setMfaMethod(e.target.value)} className="mfa-method-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }}>
            <option value="totp">totp</option>
            <option value="sms">sms</option>
            <option value="email">email</option>
            <option value="hardware_key">hardware_key</option>
          </select>
        )}
        <button className="add-btn" onClick={addSession} disabled={!user.trim()} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create Session</button>
      </div>
      <div className="session-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {sessions.map(s => {
          const valid = new Date(s.expiresAt).getTime() > Date.now() && !s.revoked;
          return (
            <div key={s.id} style={{ padding: 16, border: `1px solid ${valid ? '#16a34a' : '#dc2626'}`, borderRadius: 12, background: '#09090b' }}>
              <strong style={{ fontSize: 18 }}>{s.user}</strong>
              <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>Provider: {s.provider}</div>
              <div style={{ marginTop: 4, color: '#60a5fa', fontSize: 13 }}>MFA: {s.mfaEnabled ? s.mfaMethod : 'off'}</div>
              <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>Expires: {new Date(s.expiresAt).toLocaleTimeString()}</div>
              <div style={{ marginTop: 4, fontWeight: 'bold', color: valid ? '#4ade80' : '#f87171' }}>{valid ? 'VALID' : 'EXPIRED/REVOKED'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}