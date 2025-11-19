import bcrypt from 'bcrypt';
import { pool } from '../_shared/db.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const { username, email, password, role, organization } = req.body || {};
  if (!username || !password || !role) return res.status(400).json({ error: 'Campos faltando' });
  try {
    const rr = await pool.query('SELECT id FROM roles WHERE name=$1', [role]);
    if (rr.rowCount === 0) return res.status(400).json({ error: 'Role inválida' });
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO users (id, username, email, password_hash, role_id, organization) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuid(), username, email || null, hash, rr.rows[0].id, organization || null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar' });
  }
}
