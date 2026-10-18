export type MfaMethod = 'totp' | 'sms' | 'email' | 'hardware_key';
export type SsoProvider = 'google' | 'github' | 'microsoft' | 'okta' | 'custom';
export interface AuthSession { id: string; user: string; provider: SsoProvider; mfaEnabled: boolean; mfaMethod?: MfaMethod; createdAt: string; expiresAt: string; revoked: boolean }
export function isSessionValid(s: AuthSession): boolean {
  if (s.revoked) return false;
  return new Date(s.expiresAt).getTime() > Date.now();
}
export function sessionRemainingMinutes(s: AuthSession): number {
  const ms = new Date(s.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 60000));
}
export function requiresMfa(provider: SsoProvider, mfaEnabled: boolean): boolean {
  return mfaEnabled || provider === 'custom';
}
export function formatSession(s: AuthSession): string { return `${s.user} via ${s.provider} mfa:${s.mfaEnabled ? s.mfaMethod : 'off'} expires:${s.expiresAt} revoked:${s.revoked}`; }