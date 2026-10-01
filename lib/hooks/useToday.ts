'use client';

import { useSyncExternalStore } from 'react';
import { isoDate } from '../format';

const noSubscribe = () => () => {};

/**
 * Today as `YYYY-MM-DD` on the client; null while prerendering, so a statically
 * built page never bakes the build date into its date inputs.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, () => isoDate(new Date()), () => null);
}
