import jwt from 'jsonwebtoken';
import { pool } from './db.js';

export async function authenticate(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  const token = header ? header.split(' ')[1] : null;
  if (!token) throw { status: 401, message: 'Token ausente' };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const r = await pool.query('SELECT id, username, role_id, organization FROM users WHERE id=$1', [decoded.id]);
    if (r.rowCount === 0) throw { status: 401, message: 'Usuário não encontrado' };
    req.user = r.rows[0];
  } catch (err) {
    throw { status: 401, message: 'Token inválido' };
  }
}

export async function authorize(req, allowedRoles = []) {
  // allowedRoles: array of role names or ["any"] to allow all authenticated users
  const r = await pool.query('SELECT name FROM roles WHERE id=$1', [req.user.role_id]);
  const roleName = r.rows[0]?.name;
  if (!roleName) throw { status: 403, message: 'Role inválida' };
  if (allowedRoles.includes('any')) return;
  if (!allowedRoles.includes(roleName)) throw { status: 403, message: 'Acesso negado' };
}
