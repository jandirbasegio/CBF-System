import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';

export default async function handler(req, res) {
  const id = req.query.id;
  try {
    await authenticate(req);
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Método inválido' });
    await authorize(req, ['laboratory','cbf_staff','admin']);
    const { sample_id, scheduled_date, collected_date, laboratory, technician, chain_of_custody, status } = req.body || {};
    const r = await pool.query(
      `UPDATE tests SET sample_id=$1, scheduled_date=$2, collected_date=$3, laboratory=$4, technician=$5, chain_of_custody=$6, status=$7, updated_at=now()
       WHERE id=$8 RETURNING *`,
      [sample_id, scheduled_date, collected_date, laboratory, technician, chain_of_custody, status, id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Teste não encontrado' });
    return res.json(r.rows[0]);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
