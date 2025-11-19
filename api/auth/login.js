import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../_shared/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltando credenciais' });
  try {
    const r = await pool.query('SELECT id, password_hash FROM users WHERE username=$1', [username]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const ok = await bcrypt.compare(password, r.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const token = jwt.sign({ id: r.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
}
