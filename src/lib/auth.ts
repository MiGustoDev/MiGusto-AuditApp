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
    password: '123MiGusto.'
  },
  {
    email: 'mariasalazar@migusto.com.ar',
    name: 'María Salazar',
    role: 'Admin',
    roleLabel: 'Administradora',
    password: '123MiGusto.'
  },
  {
    email: 'elizabethcolman@migusto.com.ar',
    name: 'Elizabeth Colman',
    role: 'Admin',
    roleLabel: 'Administradora',
    password: '123MiGusto.'
  },
  {
    email: 'lidyatello@migusto.com.ar',
    name: 'Lidya Tello',
    role: 'Admin',
    roleLabel: 'Administradora',
    password: '123MiGusto.'
  }
];

export function canUserDeleteAudits(user: UserProfile | null): boolean {
  if (!user) return false;
  const email = user.email.toLowerCase().trim();
  return (
    email === 'admin@migusto.com.ar' ||
    email === 'elizabethcolman@migusto.com.ar' ||
    email === 'mariasalazar@migusto.com.ar' ||
    email === 'lidyatello@migusto.com.ar'
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

const LS_CUSTOM_PASSWORDS_KEY = 'mg_audit_custom_passwords_cache';
const CONFIG_RECORD_ID = '00000000-0000-0000-0000-000000000001';

export async function fetchCustomPasswords(): Promise<Record<string, string>> {
  const { supabase } = await import('./supabase');
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('resumen')
        .eq('id', CONFIG_RECORD_ID)
        .maybeSingle();

      if (!error && data && data.resumen) {
        try {
          const parsed = JSON.parse(data.resumen);
          const map = parsed.user_passwords || {};
          localStorage.setItem(LS_CUSTOM_PASSWORDS_KEY, JSON.stringify(map));
          return map;
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to fetch custom passwords in AuditApp:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LS_CUSTOM_PASSWORDS_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
}

export function getCachedCustomPasswords(): Record<string, string> {
  try {
    const cached = localStorage.getItem(LS_CUSTOM_PASSWORDS_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (e) {
    return {};
  }
}

export async function updateUserPassword(
  email: string,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCurrent = (currentPass || '').trim();
  const cleanNew = (newPass || '').trim();

  if (!cleanNew || cleanNew.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  const account = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (!account) {
    return { success: false, error: 'Usuario no encontrado.' };
  }

  const currentMap = await fetchCustomPasswords();
  const expectedPassword = currentMap[cleanEmail] || account.password;

  if (cleanCurrent !== expectedPassword) {
    return { success: false, error: 'La contraseña actual ingresada es incorrecta.' };
  }

  const updatedMap = {
    ...currentMap,
    [cleanEmail]: cleanNew,
  };
  localStorage.setItem(LS_CUSTOM_PASSWORDS_KEY, JSON.stringify(updatedMap));

  const { supabase } = await import('./supabase');
  if (supabase) {
    try {
      await supabase.from('audits').upsert({
        id: CONFIG_RECORD_ID,
        tienda: '__CONFIG_STORE__',
        auditor: 'SYSTEM',
        fecha: '2026-01-01',
        resumen: JSON.stringify({ user_passwords: updatedMap }),
        savedBy: 'SYSTEM',
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to sync password to Supabase in AuditApp:', err);
    }
  }

  return { success: true };
}

export async function authenticateAsync(
  emailInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  const emailClean = (emailInput || '').trim().toLowerCase();
  const passClean = (passwordInput || '').trim();

  const user = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === emailClean
  );

  if (!user) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verificá tu correo y contraseña.',
    };
  }

  let customMap: Record<string, string> = {};
  try {
    customMap = await fetchCustomPasswords();
  } catch (e) {
    customMap = getCachedCustomPasswords();
  }

  const effectivePassword = customMap[emailClean] || user.password;

  if (passClean === effectivePassword) {
    const profile: UserProfile = {
      email: user.email,
      name: user.name,
      role: user.role,
      roleLabel: user.roleLabel,
    };
    saveSession(profile);
    return { success: true, user: profile };
  }

  return {
    success: false,
    error: 'Credenciales inválidas. Verificá tu correo y contraseña.',
  };
}

export function authenticate(
  emailInput: string,
  passwordInput: string
): {
  success: boolean;
  user?: UserProfile;
  error?: string;
} {
  const emailClean = (emailInput || '').trim().toLowerCase();
  const passClean = (passwordInput || '').trim();

  const user = AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === emailClean
  );

  if (user) {
    const customMap = getCachedCustomPasswords();
    const effectivePassword = customMap[emailClean] || user.password;

    if (passClean === effectivePassword) {
      const profile: UserProfile = {
        email: user.email,
        name: user.name,
        role: user.role,
        roleLabel: user.roleLabel,
      };
      saveSession(profile);
      return { success: true, user: profile };
    }
  }

  return {
    success: false,
    error: 'Credenciales inválidas. Verificá tu correo y contraseña.',
  };
}
