import { describe, it, expect } from 'vitest';
import { openSession, revokeSession, sessionState, Session } from './authroom';
const mk = (id: string, device: string, active: boolean, ts: number): Session => ({ id, device, user: 'ana', active, ts });
describe('authroom', () => {
  it('openSession appends', () => {
    expect(openSession([], mk('1', 'Laptop', true, 1)).length).toBe(1);
  });
  it('openSession caps at 100', () => {
    let list: Session[] = [];
    for (let i = 0; i < 150; i++) list = openSession(list, mk('' + i, 'd' + i, true, i));
    expect(list.length).toBe(100);
  });
  it('revokeSession sets active false only matching', () => {
    const list = [mk('1', 'a', true, 1), mk('2', 'b', true, 2)];
    const out = revokeSession(list, '1', 10);
    expect(out[0].active).toBe(false);
    expect(out[1].active).toBe(true);
  });
  it('revokeSession on revoked stays revoked', () => {
    const list = [mk('1', 'a', false, 1)];
    expect(revokeSession(list, '1', 5)[0].active).toBe(false);
  });
  it('sessionState counts active and revoked', () => {
    const list = [mk('1', 'a', true, 1), mk('2', 'b', false, 2), mk('3', 'c', true, 3)];
    const s = sessionState(list);
    expect(s.active).toBe(2);
    expect(s.revoked).toBe(1);
  });
});