// Development-only fallback for call locks when Supabase RPC/schema is missing.
import { CallLock } from './types';

// Global variable to persist across HMR in development
const globalForLocks = global as unknown as { memLocksCache?: Map<string, CallLock> };

export const memLocksCache = globalForLocks.memLocksCache || new Map<string, CallLock>();

if (process.env.NODE_ENV !== 'production') {
  globalForLocks.memLocksCache = memLocksCache;
}
