import { CallLock, CallClaimResult } from './types';

export async function claimCompany(companyId: string, userId: string, userName: string): Promise<CallClaimResult> {
  const res = await fetch('/api/call-lock/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, userId, userName }),
  });
  if (!res.ok) {
    throw new Error('Failed to claim company call');
  }
  return res.json();
}

export async function releaseCompany(companyId: string, userId: string): Promise<void> {
  const res = await fetch('/api/call-lock/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId, userId }),
  });
  if (!res.ok) {
    throw new Error('Failed to release company call');
  }
}

export async function getLockStatus(): Promise<CallLock[]> {
  const res = await fetch('/api/call-lock/status');
  if (!res.ok) {
    throw new Error('Failed to get lock status');
  }
  return res.json();
}

export function getRemainingMinutes(lockedUntil: string | undefined): number {
  if (!lockedUntil) return 0;
  
  const end = new Date(lockedUntil).getTime();
  const now = new Date().getTime();
  const diffMs = end - now;
  
  if (diffMs <= 0) return 0;
  
  return Math.ceil(diffMs / (1000 * 60));
}
