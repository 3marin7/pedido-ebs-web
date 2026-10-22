const PLATFORM_MANAGEMENT_EMAILS = new Set([
  'ewinma@gmail.com',
  '3marin7@gmail.com',
]);

export const normalizeRole = (role) => {
  if (!role) return '';
  const normalized = String(role).trim().toLowerCase();

  switch (normalized) {
    case 'administrador':
    case 'administracion':
    case 'administración':
      return 'admin';
    case 'superadministrador':
    case 'super administrador':
      return 'superadmin';
    default:
      return normalized;
  }
};

export const isAdminRole = (role) => normalizeRole(role) === 'admin';
export const isSuperAdminRole = (role) => normalizeRole(role) === 'superadmin';

export const canViewPlatformManagement = (email) =>
  PLATFORM_MANAGEMENT_EMAILS.has(String(email || '').trim().toLowerCase());
