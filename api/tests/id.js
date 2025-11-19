// /api/tests/[id].js
import pool from "../../_db.js";
import { verifyToken } from "../../_auth.js";

/**
 * PUT /api/tests/:id  -> atualiza campos do teste (sample_id, collected_date, status, laboratory, technician...)
 */
export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  const id = req.query.id;

  try {
    if (req.method !== "PUT") return res.status(405).json({ error: "Método não permitido" });

    const {
      sample_id,
      scheduled_date,
      collected_date,
      laboratory,
      technician,
      chain_of_custody,
      status
    } = req.body;

    const q = `
      UPDATE tests SET
        sample_id = $1,
        scheduled_date = $2,
        collected_date = $3,
        laboratory = $4,
        technician = $5,
        chain_of_custody = $6,
        status = $7,
        updated_at = now()
      WHERE id = $8
      RETURNING *
    `;

    const r = await pool.query(q, [
      sample_id || null,
      scheduled_date || null,
      collected_date || null,
      laboratory || null,
      technician || null,
      chain_of_custody || null,
      status || null,
      id
    ]);

    if (r.rowCount === 0) return res.status(404).json({ error: "Teste não encontrado" });

    return res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
