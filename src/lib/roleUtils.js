export const normalizeRole = (role) => {
  if (!role) return '';
  const normalized = String(role).trim().toLowerCase();

  switch (normalized) {
    case 'administrador':
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
