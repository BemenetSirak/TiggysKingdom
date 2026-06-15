const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const API = import.meta.env.VITE_API_URL ?? (isLocal ? 'http://localhost:4242' : '');
