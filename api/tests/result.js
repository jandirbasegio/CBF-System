import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  try {
    await authenticate(req);
    await authorize(req, ['laboratory','cbf_staff','admin']);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
    const { test_id, result, substances, analysis_report } = req.body || {};
    const r = await pool.query(
      `INSERT INTO test_results (id, test_id, result, substances, analysis_report, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuid(), test_id, result, substances ? JSON.stringify(substances) : null, analysis_report || null, req.user.id]
    );
    await pool.query('UPDATE tests SET status=$1, updated_at=now() WHERE id=$2', ['completed', test_id]);
    return res.json(r.rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
