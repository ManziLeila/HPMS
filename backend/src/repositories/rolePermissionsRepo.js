import db from './db.js';

const TABLE = 'hpms_core.role_permissions';

const cache = new Map();
const CACHE_TTL_MS = 30 * 1000;

function getCached(role) {
  const entry = cache.get(role);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(role);
    return null;
  }
  return entry.permissions;
}

function setCached(role, permissions) {
  cache.set(role, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(role) {
  if (role) cache.delete(role); else cache.clear();
}

/**
 * Get permissions array for a role (from DB, with cache). Returns [] if role not found.
 */
export async function getRolePermissions(role) {
  if (!role) return [];
  const cached = getCached(role);
  if (cached) return cached;
  const { rows } = await db.query(
    `SELECT permissions FROM ${TABLE} WHERE role = $1`,
    [role]
  );
  if (!rows[0]) return [];
  const p = rows[0].permissions;
  const list = Array.isArray(p) ? p : (p ? [p] : []);
  setCached(role, list);
  return list;
}

/**
 * Get all role permissions as { role, permissions[] }.
 */
export async function getAllRolePermissions() {
  const { rows } = await db.query(
    `SELECT role, permissions FROM ${TABLE} ORDER BY role`
  );
  return rows.map((r) => ({
    role: r.role,
    permissions: Array.isArray(r.permissions) ? r.permissions : (r.permissions ? [r.permissions] : []),
  }));
}

/**
 * Set permissions for a role. Replaces existing. Returns updated { role, permissions }.
 * Invalidates cache for this role.
 */
export async function setRolePermissions(role, permissions) {
  const list = Array.isArray(permissions) ? permissions : [];
  const { rows } = await db.query(
    `INSERT INTO ${TABLE} (role, permissions)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (role) DO UPDATE SET permissions = $2::jsonb
     RETURNING role, permissions`,
    [role, JSON.stringify(list)]
  );
  invalidateCache(role);
  if (!rows[0]) return null;
  const p = rows[0].permissions;
  return {
    role: rows[0].role,
    permissions: Array.isArray(p) ? p : (p ? [p] : []),
  };
}

export { invalidateCache };
