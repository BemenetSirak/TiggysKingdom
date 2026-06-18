import type { User, SubscriptionTier } from '../context/AuthContext';

const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,
  kingdom_lamb: 10,
  royal_family: Infinity,
  monastery: Infinity,
};

const countKey = (userId: string) => `tk_download_count_${userId}`;

function getDownloadCount(userId: string): number {
  try { return parseInt(localStorage.getItem(countKey(userId)) || '0', 10) || 0; } catch { return 0; }
}

export type DownloadBlockReason = 'guest' | 'no-subscription' | 'limit-reached';

export interface DownloadCheck {
  allowed: boolean;
  reason?: DownloadBlockReason;
}

export function checkDownloadAccess(user: User | null): DownloadCheck {
  if (!user || user.isGuest) return { allowed: false, reason: 'guest' };
  const limit = TIER_LIMITS[user.subscriptionTier || 'free'];
  if (limit === 0) return { allowed: false, reason: 'no-subscription' };
  if (limit === Infinity) return { allowed: true };
  if (getDownloadCount(user.id) >= limit) return { allowed: false, reason: 'limit-reached' };
  return { allowed: true };
}

export function recordDownload(user: User | null): void {
  if (!user || user.isGuest) return;
  const limit = TIER_LIMITS[user.subscriptionTier || 'free'];
  if (limit === Infinity) return;
  try { localStorage.setItem(countKey(user.id), String(getDownloadCount(user.id) + 1)); } catch { /* ignore */ }
}

export function downloadBlockMessage(reason: DownloadBlockReason): string {
  switch (reason) {
    case 'guest': return 'Log in or create a free account to download this.';
    case 'no-subscription': return 'Downloads require a paid plan — visit Subscribe to upgrade!';
    case 'limit-reached': return "You've used all your plan's downloads — upgrade for unlimited access!";
  }
}
