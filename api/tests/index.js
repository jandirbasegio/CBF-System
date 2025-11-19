import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  try {
    await authenticate(req);

    if (req.method === 'GET') {
      await authorize(req, ['any']);
      const r = await pool.query(`
        SELECT t.*, a.first_name, a.last_name
        FROM tests t
        JOIN athletes a ON a.id = t.athlete_id
        ORDER BY scheduled_date DESC
      `);
      return res.json(r.rows);
    }

    if (req.method === 'POST') {
      await authorize(req, ['club','federation','laboratory','cbf_staff','admin']);
      const { athlete_id, sample_id, scheduled_date, laboratory } = req.body || {};
      const r = await pool.query(
        `INSERT INTO tests (id, athlete_id, sample_id, scheduled_date, laboratory, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [uuid(), athlete_id, sample_id, scheduled_date, laboratory || null, req.user.id]
      );
      return res.json(r.rows[0]);
    }

    res.status(405).json({ error: 'Método inválido' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
