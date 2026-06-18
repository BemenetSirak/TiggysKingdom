import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type SubscriptionTier = 'free' | 'kingdom_lamb' | 'royal_family' | 'monastery';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isGuest?: boolean;
  joinedDate?: string;
  subscriptionTier?: SubscriptionTier;
}

export interface VideoProgress {
  videoId: string;
  title: string;
  episodeNum: number;
  timestamp: number;
  duration: number;
  lastWatchedAt: string;
}

export interface EpisodeActivity {
  type: 'episode';
  videoId: string;
  title: string;
  episodeNum: number;
  timestamp: number;
  savedAt?: string;
}

export interface OrderActivity {
  type: 'order';
  items: Array<{ id: number; title: string; price: number }>;
  total: number;
  savedAt?: string;
}

export type Activity = EpisodeActivity | OrderActivity;

export interface FavoriteVideo {
  id: string;
  title: string;
  savedAt: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  loginAsGuest: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshSubscriptionTier: () => Promise<void>;
  saveActivity: (userId: string, activity: Omit<Activity, 'savedAt'>) => void;
  getLastActivity: (userId: string) => Activity | null;
  saveVideoProgress: (userId: string, progress: Omit<VideoProgress, 'lastWatchedAt'>) => void;
  getVideoProgress: (userId: string, videoId: string) => VideoProgress | null;
  getWatchHistory: (userId: string) => VideoProgress[];
  addFavorite: (userId: string, video: { id: string; title: string }) => void;
  removeFavorite: (userId: string, videoId: string) => void;
  getFavorites: (userId: string) => FavoriteVideo[];
}

const AuthContext = createContext<AuthContextValue | null>(null);
import { API } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tk_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed?.id && !parsed.isGuest) refreshSubscriptionTier(parsed.id);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const refreshSubscriptionTier = useCallback(async (idOverride?: string) => {
    const id = idOverride || user?.id;
    if (!id || id === 'guest') return;
    try {
      const res = await fetch(`${API}/api/users/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.subscriptionTier) return;
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, subscriptionTier: data.subscriptionTier };
        localStorage.setItem('tk_user', JSON.stringify(updated));
        return updated;
      });
    } catch { /* offline — keep last known tier */ }
  }, [user?.id]);

  const login = (email: string, password: string) => {
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
    const byEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!byEmail) return { success: false, error: 'No account found with that email address.' };
    if (byEmail.password !== password) return { success: false, error: 'Incorrect password. Please try again.' };
    const found = byEmail;
    const { password: _, ...safe } = found;
    setUser(safe);
    localStorage.setItem('tk_user', JSON.stringify(safe));
    refreshSubscriptionTier(safe.id);
    return { success: true };
  };

  const register = (name: string, email: string, password: string) => {
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      avatar: null,
      joinedDate: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('tk_users', JSON.stringify(users));
    const { password: _, ...safe } = newUser;
    setUser(safe);
    localStorage.setItem('tk_user', JSON.stringify(safe));

    fetch(`${API}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: safe.id, name, email, joinedDate: safe.joinedDate }),
    }).catch(() => {});

    return { success: true };
  };

  const loginAsGuest = () => {
    const guest: User = { id: 'guest', name: 'Guest', email: '', avatar: null, isGuest: true };
    setUser(guest);
    localStorage.setItem('tk_user', JSON.stringify(guest));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tk_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('tk_user', JSON.stringify(updated));
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; localStorage.setItem('tk_users', JSON.stringify(users)); }
  };

  const saveActivity = useCallback((userId: string, activity: Omit<Activity, 'savedAt'>) => {
    if (!userId || userId === 'guest') return;
    localStorage.setItem(`tk_activity_${userId}`, JSON.stringify({ ...activity, savedAt: new Date().toISOString() }));
  }, []);

  const getLastActivity = (userId: string): Activity | null => {
    if (!userId) return null;
    try { return JSON.parse(localStorage.getItem(`tk_activity_${userId}`) || 'null'); }
    catch { return null; }
  };

  const getWatchHistory = useCallback((userId: string): VideoProgress[] => {
    if (!userId || userId === 'guest') return [];
    try { return JSON.parse(localStorage.getItem(`tk_watch_history_${userId}`) || '[]'); }
    catch { return []; }
  }, []);

  const getVideoProgress = useCallback((userId: string, videoId: string): VideoProgress | null => {
    if (!userId || !videoId) return null;
    try {
      const history: VideoProgress[] = JSON.parse(localStorage.getItem(`tk_watch_history_${userId}`) || '[]');
      return history.find(h => h.videoId === videoId) ?? null;
    } catch { return null; }
  }, []);

  const saveVideoProgress = useCallback((userId: string, { videoId, title, episodeNum, timestamp, duration }: Omit<VideoProgress, 'lastWatchedAt'>) => {
    if (!userId || userId === 'guest' || !videoId) return;
    try {
      const history: VideoProgress[] = JSON.parse(localStorage.getItem(`tk_watch_history_${userId}`) || '[]');
      const idx = history.findIndex(h => h.videoId === videoId);
      const entry: VideoProgress = { videoId, title, episodeNum, timestamp, duration, lastWatchedAt: new Date().toISOString() };
      if (idx !== -1) { history[idx] = entry; } else { history.unshift(entry); }
      localStorage.setItem(`tk_watch_history_${userId}`, JSON.stringify(history.slice(0, 50)));
    } catch { /* ignore */ }
    saveActivity(userId, { type: 'episode', videoId, title, episodeNum, timestamp } as Omit<EpisodeActivity, 'savedAt'>);
  }, [saveActivity]);

  const getFavorites = useCallback((userId: string): FavoriteVideo[] => {
    if (!userId || userId === 'guest') return [];
    try { return JSON.parse(localStorage.getItem(`tk_favorites_${userId}`) || '[]'); }
    catch { return []; }
  }, []);

  const addFavorite = useCallback((userId: string, video: { id: string; title: string }) => {
    if (!userId || userId === 'guest') return;
    const favs = getFavorites(userId);
    if (favs.some(f => f.id === video.id)) return;
    favs.unshift({ ...video, savedAt: new Date().toISOString() });
    localStorage.setItem(`tk_favorites_${userId}`, JSON.stringify(favs));
  }, [getFavorites]);

  const removeFavorite = useCallback((userId: string, videoId: string) => {
    if (!userId || userId === 'guest') return;
    const favs = getFavorites(userId).filter(f => f.id !== videoId);
    localStorage.setItem(`tk_favorites_${userId}`, JSON.stringify(favs));
  }, [getFavorites]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsGuest, updateUser, refreshSubscriptionTier, saveActivity, getLastActivity, saveVideoProgress, getVideoProgress, getWatchHistory, addFavorite, removeFavorite, getFavorites }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
