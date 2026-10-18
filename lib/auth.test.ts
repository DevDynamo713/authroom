import { describe, it, expect } from 'vitest';
import { isSessionValid, sessionRemainingMinutes, requiresMfa, formatSession } from './auth';
describe('auth', () => {
  it('valid session not revoked and future', () => {
    const s = { id: '1', user: 'alice', provider: 'google', mfaEnabled: true, mfaMethod: 'totp', createdAt: '2026-10-19T12:00:00Z', expiresAt: new Date(Date.now() + 3600000).toISOString(), revoked: false };
    expect(isSessionValid(s)).toBe(true);
  });
  it('revoked session invalid', () => {
    const s = { id: '2', user: 'bob', provider: 'github', mfaEnabled: false, createdAt: '2026-10-19T12:00:00Z', expiresAt: new Date(Date.now() + 3600000).toISOString(), revoked: true };
    expect(isSessionValid(s)).toBe(false);
  });
  it('expired session invalid', () => {
    const s = { id: '3', user: 'carol', provider: 'google', mfaEnabled: false, createdAt: '2026-10-19T12:00:00Z', expiresAt: new Date(Date.now() - 1000).toISOString(), revoked: false };
    expect(isSessionValid(s)).toBe(false);
  });
  it('remaining minutes positive for future', () => {
    const s = { id: '4', user: 'dave', provider: 'google', mfaEnabled: false, createdAt: '2026-10-19T12:00:00Z', expiresAt: new Date(Date.now() + 5 * 60000).toISOString(), revoked: false };
    expect(sessionRemainingMinutes(s)).toBeGreaterThanOrEqual(4);
  });
  it('requiresMfa true when enabled', () => { expect(requiresMfa('google', true)).toBe(true); });
  it('requiresMfa true for custom provider', () => { expect(requiresMfa('custom', false)).toBe(true); });
  it('requiresMfa false for google without mfa', () => { expect(requiresMfa('google', false)).toBe(false); });
  it('formats correctly', () => {
    const s = { id: '5', user: 'alice', provider: 'google', mfaEnabled: true, mfaMethod: 'totp', createdAt: '2026-10-19T12:00:00Z', expiresAt: '2026-10-19T13:00:00Z', revoked: false };
    expect(formatSession(s)).toBe('alice via google mfa:totp expires:2026-10-19T13:00:00Z revoked:false');
  });
});