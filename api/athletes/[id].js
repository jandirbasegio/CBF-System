import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';

export default async function handler(req, res) {
  const id = req.query.id;
  try {
    await authenticate(req);

    if (req.method === 'GET') {
      const r = await pool.query('SELECT * FROM athletes WHERE id=$1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Atleta não encontrado' });
      return res.json(r.rows[0]);
    }

    if (req.method === 'PUT') {
      await authorize(req, ['club','federation','cbf_staff','admin']);
      const { first_name, last_name, date_of_birth, nationality, gender, id_document, club_id } = req.body || {};
      const r = await pool.query(
        `UPDATE athletes SET first_name=$1,last_name=$2,date_of_birth=$3,nationality=$4,gender=$5,id_document=$6,club_id=$7,updated_at=now()
         WHERE id=$8 RETURNING *`,
        [first_name,last_name,date_of_birth,nationality,gender,id_document,club_id || null, id]
      );
      if (r.rowCount === 0) return res.status(404).json({ error: 'Atleta não encontrado' });
      return res.json(r.rows[0]);
    }

    if (req.method === 'DELETE') {
      await authorize(req, ['cbf_staff','admin']);
      await pool.query('DELETE FROM athletes WHERE id=$1', [id]);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método inválido' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
