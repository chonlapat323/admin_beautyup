export const ADMIN_SESSION_COOKIE = "beautyup_admin_session";

export type AdminSession = {
  accessToken: string;
  admin: {
    id: string;
    email: string;
    role: string;
  };
};

export function encodeAdminSession(session: AdminSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeAdminSession(value?: string | null): AdminSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AdminSession;

    if (!parsed?.accessToken || !parsed?.admin?.email || !parsed?.admin?.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
