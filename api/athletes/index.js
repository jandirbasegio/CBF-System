import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  try {
    await authenticate(req);

    if (req.method === 'GET') {
      await authorize(req, ['any']);
      const q = req.query?.q;
      let base = 'SELECT a.*, c.name as club_name FROM athletes a LEFT JOIN clubs c ON a.club_id = c.id';
      const params = [];
      if (q) {
        params.push(`%${q}%`);
        base += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR id_document ILIKE $1`;
      }
      base += ' ORDER BY created_at DESC LIMIT 500';
      const r = await pool.query(base, params);
      return res.json(r.rows);
    }

    if (req.method === 'POST') {
      await authorize(req, ['club','federation','cbf_staff','admin']);
      const { first_name, last_name, date_of_birth, nationality, gender, id_document, club_id } = req.body || {};
      const r = await pool.query(
        `INSERT INTO athletes (id, first_name, last_name, date_of_birth, nationality, gender, id_document, club_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [uuid(), first_name, last_name, date_of_birth, nationality, gender, id_document, club_id || null, req.user.id]
      );
      return res.json(r.rows[0]);
    }

    res.status(405).json({ error: 'Método inválido' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
