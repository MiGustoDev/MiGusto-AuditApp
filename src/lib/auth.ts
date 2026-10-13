export interface UserProfile {
  email: string;
  name: string;
  role: 'Supervisor' | 'Admin';
  roleLabel: string;
}

export const AUTHORIZED_USERS: {
  email: string;
  name: string;
  role: 'Supervisor' | 'Admin';
  roleLabel: string;
  password: string;
}[] = [
  // Supervisores
  {
    email: 'selenehernandez@migusto.com.ar',
    name: 'Selene Hernández',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },
  {
    email: 'wandaruiz@migusto.com.ar',
    name: 'Wanda Ruiz',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },
  {
    email: 'martinsastre@migusto.com.ar',
    name: 'Martín Sastre',
    role: 'Supervisor',
    roleLabel: 'Supervisor',
    password: 'MiGusto123.'
  },
  {
    email: 'damarisburgos@migusto.com.ar',
    name: 'Damaris Burgos',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },
  {
    email: 'evelyncedron@migusto.com.ar',
    name: 'Evelyn Cedrón',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },
  {
    email: 'lidyatello@migusto.com.ar',
    name: 'Lidya Tello',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },
  {
    email: 'sashaalfini@migusto.com.ar',
    name: 'Sasha Alfini',
    role: 'Supervisor',
    roleLabel: 'Supervisora',
    password: 'MiGusto123.'
  },

  // Admins
  {
    email: 'admin@migusto.com.ar',
    name: 'Administración Mi Gusto',
    role: 'Admin',
    roleLabel: 'Administrador General',
    password: 'MiGusto123.'
  },
  {
    email: 'mariasalazar@migusto.com.ar',
    name: 'María Salazar',
    role: 'Admin',
    roleLabel: 'Administradora',
    password: 'MiGusto123.'
  },
  {
    email: 'elizabethcolman@migusto.com.ar',
    name: 'Elizabeth Colman',
    role: 'Admin',
    roleLabel: 'Administradora',
    password: 'MiGusto123.'
  }
];

export function canUserDeleteAudits(user: UserProfile | null): boolean {
  if (!user) return false;
  const email = user.email.toLowerCase().trim();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar'
  );
}

const SESSION_KEY = 'migusto_audit_session_v1';

export function getStoredSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveSession(user: UserProfile) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving session:', err);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Error clearing session:', err);
  }
}

export function authenticate(emailInput: string, passwordInput: string): {
  success: boolean;
  user?: UserProfile;
  error?: string;
} {
  const emailClean = (emailInput || '').trim().toLowerCase();
  const passClean = (passwordInput || '').trim();

  const user = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === emailClean && u.password === passClean
  );

  if (user) {
    const profile: UserProfile = {
      email: user.email,
      name: user.name,
      role: user.role,
      roleLabel: user.roleLabel
    };
    saveSession(profile);
    return { success: true, user: profile };
  }

  return {
    success: false,
    error: 'Credenciales inválidas. Verificá tu correo y contraseña.'
  };
}
