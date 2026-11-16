"use client";
import { useState, useEffect, useRef, use } from 'react';
import { openSession, revokeSession, sessionState, Session } from '../../../lib/authroom';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://authroom.devdynamo713.workers.dev';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://authroom.devdynamo713.workers.dev';
const pendingMsgs: string[] = [];

export default function Room({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [device, setDevice] = useState('Laptop');
  const [user, setUser] = useState('ana');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/room/${id}/ws`);
      ws.onopen = () => {
        reconnectRef.current = 0;
        while (pendingMsgs.length > 0) { const m = pendingMsgs.shift(); if (m) ws.send(m); }
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'event') {
          const d = msg.data;
          setSessions((prev) => {
            if (d.kind === 'open') return openSession(prev, { id: d.sessionId, device: d.device, user: d.user, active: true, ts: d.ts });
            return revokeSession(prev, d.sessionId, d.ts);
          });
        }
      };
      ws.onclose = () => { setTimeout(connect, Math.min(1000 * 2 ** reconnectRef.current++, 30000)); };
      wsRef.current = ws;
    };
    connect();
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/room/${id}/state`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
          setHydrated(true);
          if (typeof document !== 'undefined') document.documentElement.setAttribute('data-hydrated', '1');
        }
      } catch {}
    }, 3000);
    return () => { wsRef.current?.close(); clearInterval(poll); };
  }, [id]);

  const send = async (kind: 'open' | 'revoke', sessionId?: string) => {
    const sid = sessionId || ('sess-' + Date.now());
    const body = JSON.stringify({ kind, sessionId: sid, device, user, ts: Date.now() });
    await fetch(`${API_URL}/room/${id}/event`, { method: 'POST', body });
  };

  const st = sessionState(sessions);

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'monospace' }}>
      <h1 style={{ fontFamily: 'sans-serif' }}>AuthRoom: {id}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input className="device-input" value={device} onChange={(e) => setDevice(e.target.value)} placeholder="device" style={{ padding: 8, background: '#111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa', width: 130 }} />
        <input className="user-input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="user" style={{ padding: 8, background: '#111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa', width: 100 }} />
        <button className="open-btn" onClick={() => send('open')} disabled={!hydrated || !device.trim()} style={{ padding: '8px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Open session</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="active-chip" style={{ border: '1px solid #16a34a', color: '#4ade80', borderRadius: 9999, padding: '2px 10px', fontSize: 12 }}>active: {st.active}</span>
        <span className="revoked-chip" style={{ border: '1px solid #dc2626', color: '#f87171', borderRadius: 9999, padding: '2px 10px', fontSize: 12 }}>revoked: {st.revoked}</span>
      </div>
      <div className="session-wall" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sessions.map((s, i) => (
          <div key={s.id + '-' + i} className="session-row" style={{ border: '1px solid #27272a', borderRadius: 8, padding: 8, background: '#09090b', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="session-device" style={{ color: '#e5e5e5' }}>{s.device}</span>
            <span className="session-user" style={{ color: '#a1a1aa' }}>{s.user}</span>
            <span className="session-status" style={{ color: s.active ? '#4ade80' : '#f87171' }}>{s.active ? 'active' : 'revoked'}</span>
            <button className="revoke-btn" onClick={() => send('revoke', s.id)} disabled={!hydrated || !s.active} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}