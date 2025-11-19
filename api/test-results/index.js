// /api/test-results/index.js
import pool from "../../_db.js";
import { verifyToken } from "../../_auth.js";

/**
 * GET  /api/test-results      -> lista resultados (com info do atleta + teste)
 * POST /api/test-results      -> cria resultado; body: { test_id, result, substances (array), analysis_report }
 */
export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const r = await pool.query(`
        SELECT tr.*, t.sample_id, t.scheduled_date, a.first_name, a.last_name, a.id_document
        FROM test_results tr
        LEFT JOIN tests t ON t.id = tr.test_id
        LEFT JOIN athletes a ON a.id = t.athlete_id
        ORDER BY tr.reported_at DESC
        LIMIT 1000
      `);
      return res.json(r.rows);
    }

    if (req.method === "POST") {
      const { test_id, result, substances, analysis_report } = req.body;

      if (!test_id || !result) return res.status(400).json({ error: "test_id e result são obrigatórios" });

      const r = await pool.query(
        `INSERT INTO test_results (id, test_id, result, substances, analysis_report, reported_by)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING *`,
        [test_id, result, substances ? JSON.stringify(substances) : null, analysis_report || null, user.id]
      );

      // atualiza status do teste
      await pool.query(`UPDATE tests SET status = 'completed', updated_at = now() WHERE id = $1`, [test_id]);

      return res.status(201).json(r.rows[0]);
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
