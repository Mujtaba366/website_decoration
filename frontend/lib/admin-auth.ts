const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface AdminSession {
  id: string;
  username: string;
  token: string;
  loggedInAt: number;
}

export async function authenticateAdmin(credentials: AdminCredentials): Promise<AdminSession | null> {
  try {
    const response = await fetch(`${API_BASE}/admin/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const session: AdminSession = {
      id: data.id,
      username: data.username,
      token: data.token,
      loggedInAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }

    return session;
  } catch (error) {
    console.error('Admin auth error:', error);
    return null;
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionStr) {
    return null;
  }

  try {
    const session: AdminSession = JSON.parse(sessionStr);

    if (Date.now() - session.loggedInAt > ADMIN_SESSION_TIMEOUT) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminLoggedIn(): boolean {
  return getAdminSession() !== null;
}

export function getAdminToken(): string | null {
  const session = getAdminSession();
  return session?.token || null;
}
