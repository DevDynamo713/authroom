export interface Session { id: string; device: string; user: string; active: boolean; ts: number }
export const SESSION_CAP = 100;

export function openSession(sessions: Session[], s: Session): Session[] { return [...sessions, s].slice(-SESSION_CAP); }
export function revokeSession(sessions: Session[], id: string, ts: number): Session[] {
  return sessions.map((s) => (s.id === id ? { ...s, active: false, ts } : s));
}
export function sessionState(sessions: Session[]): { active: number; revoked: number } {
  let active = 0; let revoked = 0;
  for (const s of sessions) { if (s.active) active++; else revoked++; }
  return { active, revoked };
}