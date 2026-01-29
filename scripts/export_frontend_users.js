// scripts/export_frontend_users.js
// Exporta los usuarios definidos en el frontend (Login.jsx) a CSV
// Por seguridad, por defecto NO exporta contraseñas.

const fs = require('fs');
const path = require('path');

// Lista igual que la del frontend Login.jsx
const users = [
  { id: 1, username: 'e11', password: 'emc', role: 'admin', descripcion: 'Admin - Acceso Total.' },
  { id: 2, username: 'EBS', password: '801551', role: 'admin', descripcion: 'Admin - Acceso Total.' },
  { id: 3, username: 'inv', password: '1v3nt', role: 'inventario', descripcion: 'Bodega (Inventario).' },
  { id: 4, username: 'caro', password: 'caro123', role: 'contabilidad', descripcion: 'Contabilidad.' }
];

const includePasswords = process.argv.includes('--include-passwords');

const rows = users.map(u => ({
  id: u.id,
  username: u.username,
  role: u.role,
  descripcion: u.descripcion,
  password: includePasswords ? u.password : ''
}));

const header = ['id','username','role','descripcion','password'];
const csv = [header.join(',')].concat(rows.map(r => {
  return [r.id, r.username, r.role, `"${(r.descripcion||'').replace(/"/g,'""')}"`, r.password].join(',');
})).join('\n');

const outPath = path.join(__dirname, 'frontend_users.csv');
fs.writeFileSync(outPath, csv, { encoding: 'utf8' });
console.log('Exportado:', outPath);
if (!includePasswords) console.log('Nota: las contraseñas NO fueron incluidas. Agrega --include-passwords para incluirlas (solo si entiendes el riesgo).');
