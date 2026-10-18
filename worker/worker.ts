export interface Env { AUTHROOM_DO: DurableObjectNamespace; }
export class AuthRoomDO {
  private state: DurableObjectState;
  private sessions: Map<string, any> = new Map();
  private websockets: WebSocket[] = [];
  constructor(state: DurableObjectState, env: Env) { this.state = state; }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname === '/sessions' && request.method === 'GET') {
      return Response.json(Array.from(this.sessions.values()));
    }
    if (url.pathname === '/session' && request.method === 'POST') {
      const data = await request.json();
      const session = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), revoked: false };
      this.sessions.set(session.id, session);
      this.broadcast(JSON.stringify({ type: 'session', data: session }));
      return Response.json({ success: true, session });
    }
    return new Response('Not Found', { status: 404 });
  }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) { }
  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) { this.websockets = this.websockets.filter(w => w !== ws); }
  private broadcast(msg: string) { for (const ws of this.websockets) { if (ws.readyState === 1) ws.send(msg); } }
}
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const id = env.AUTHROOM_DO.idFromName(url.pathname);
    const stub = env.AUTHROOM_DO.get(id);
    return stub.fetch(request);
  }
}