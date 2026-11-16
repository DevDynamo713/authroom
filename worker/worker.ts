export interface Env { AUTHROOM_DO: DurableObjectNamespace; }
interface Session { id: string; device: string; user: string; active: boolean; ts: number }
interface State { sessions: Session[] }
const DEFAULT_STATE: State = { sessions: [] };
const SESSION_CAP = 100;

export class AuthRoomDO {
  private state: DurableObjectState;
  constructor(state: DurableObjectState, env: Env) { this.state = state; }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const storage = this.state.storage;

    if (url.pathname.endsWith('/ws')) {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname.endsWith('/state') && request.method === 'GET') {
      const s: State = (await storage.get('state')) || DEFAULT_STATE;
      return new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    if (url.pathname.endsWith('/event') && request.method === 'POST') {
      const d = await request.json() as { kind: 'open' | 'revoke'; sessionId: string; device?: string; user?: string; ts: number };
      const s: State = (await storage.get('state')) || DEFAULT_STATE;
      if (d.kind === 'open') {
        const rec: Session = { id: d.sessionId, device: d.device || 'unknown', user: d.user || 'anon', active: true, ts: Number(d.ts) };
        s.sessions = [...s.sessions, rec].slice(-SESSION_CAP);
      } else {
        s.sessions = s.sessions.map((x) => (x.id === d.sessionId ? { ...x, active: false, ts: Number(d.ts) } : x));
      }
      await storage.put('state', s);
      this.broadcast(JSON.stringify({ type: 'event', data: d }));
      return new Response(JSON.stringify({ success: true }), { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    return new Response('Not Found', { status: 404 });
  }

  private broadcast(msg: string) {
    for (const ws of this.state.getWebSockets()) { if (ws.readyState === 1) ws.send(msg); }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const rm = url.pathname.match(/\/room\/([^/]+)/);
    const room = rm ? rm[1] : 'default';
    const id = env.AUTHROOM_DO.idFromName(room);
    return env.AUTHROOM_DO.get(id).fetch(request);
  }
};