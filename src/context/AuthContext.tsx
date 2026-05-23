import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isGuest?: boolean;
  joinedDate?: string;
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

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  loginAsGuest: () => void;
  updateUser: (updates: Partial<User>) => void;
  saveActivity: (userId: string, activity: Omit<Activity, 'savedAt'>) => void;
  getLastActivity: (userId: string) => Activity | null;
  saveVideoProgress: (userId: string, progress: Omit<VideoProgress, 'lastWatchedAt'>) => void;
  getVideoProgress: (userId: string, videoId: string) => VideoProgress | null;
  getWatchHistory: (userId: string) => VideoProgress[];
}

const AuthContext = createContext<AuthContextValue | null>(null);
import { API } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tk_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, error: 'Invalid email or password.' };
    const { password: _, ...safe } = found;
    setUser(safe);
    localStorage.setItem('tk_user', JSON.stringify(safe));
    return { success: true };
  };

  const register = (name: string, email: string, password: string) => {
    const users: (User & { password: string })[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
    if (users.find(u => u.email === email)) {
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

  const saveActivity = (userId: string, activity: Omit<Activity, 'savedAt'>) => {
    if (!userId || userId === 'guest') return;
    localStorage.setItem(`tk_activity_${userId}`, JSON.stringify({ ...activity, savedAt: new Date().toISOString() }));
  };

  const getLastActivity = (userId: string): Activity | null => {
    if (!userId) return null;
    try { return JSON.parse(localStorage.getItem(`tk_activity_${userId}`) || 'null'); }
    catch { return null; }
  };

  const getWatchHistory = (userId: string): VideoProgress[] => {
    if (!userId || userId === 'guest') return [];
    try { return JSON.parse(localStorage.getItem(`tk_watch_history_${userId}`) || '[]'); }
    catch { return []; }
  };

  const getVideoProgress = (userId: string, videoId: string): VideoProgress | null => {
    if (!userId || !videoId) return null;
    return getWatchHistory(userId).find(h => h.videoId === videoId) ?? null;
  };

  const saveVideoProgress = (userId: string, { videoId, title, episodeNum, timestamp, duration }: Omit<VideoProgress, 'lastWatchedAt'>) => {
    if (!userId || userId === 'guest' || !videoId) return;
    const history = getWatchHistory(userId);
    const idx = history.findIndex(h => h.videoId === videoId);
    const entry: VideoProgress = { videoId, title, episodeNum, timestamp, duration, lastWatchedAt: new Date().toISOString() };
    if (idx !== -1) {
      history[idx] = entry;
    } else {
      history.unshift(entry);
    }
    localStorage.setItem(`tk_watch_history_${userId}`, JSON.stringify(history.slice(0, 50)));
    saveActivity(userId, { type: 'episode', videoId, title, episodeNum, timestamp } as Omit<EpisodeActivity, 'savedAt'>);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginAsGuest, updateUser, saveActivity, getLastActivity, saveVideoProgress, getVideoProgress, getWatchHistory }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
