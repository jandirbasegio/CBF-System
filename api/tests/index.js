// /api/tests/index.js
import pool from "../../_db.js";
import { verifyToken } from "../../_auth.js";

/**
 * GET  /api/tests?search=...   -> lista testes (com dados do atleta)
 * POST /api/tests             -> cria teste; body pode conter:
 *    - athlete_id (uuid) OR
 *    - athlete_name (string "First Last")
 *    - sample_id, scheduled_date, laboratory
 */
export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const search = (req.query.search || "").trim();

      const q = `
        SELECT t.*, a.first_name, a.last_name, a.id_document
        FROM tests t
        LEFT JOIN athletes a ON a.id = t.athlete_id
        WHERE ($1 = '' OR LOWER(a.first_name || ' ' || a.last_name) LIKE LOWER($1))
        ORDER BY t.scheduled_date DESC
        LIMIT 1000
      `;

      const r = await pool.query(q, [search ? `%${search}%` : ""]);
      return res.status(200).json(r.rows);
    }

    if (req.method === "POST") {
      const {
        athlete_id,
        athlete_name,
        sample_id,
        scheduled_date,
        laboratory,
        technician,
        chain_of_custody
      } = req.body;

      let resolvedAthleteId = athlete_id || null;

      if (!resolvedAthleteId && athlete_name) {
        // procura atleta por full name (first + last), pega primeiro resultado
        const s = athlete_name.trim();
        const r0 = await pool.query(
          `SELECT id FROM athletes WHERE LOWER(first_name || ' ' || last_name) = LOWER($1) LIMIT 1`,
          [s]
        );
        if (r0.rowCount === 0) {
          return res.status(400).json({ error: "Atleta não encontrado pelo nome informado" });
        }
        resolvedAthleteId = r0.rows[0].id;
      }

      if (!resolvedAthleteId) {
        return res.status(400).json({ error: "athlete_id ou athlete_name é necessário" });
      }

      const insertQ = `
        INSERT INTO tests (id, athlete_id, sample_id, scheduled_date, laboratory, technician, chain_of_custody, created_by)
        VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6, $7)
        RETURNING *
      `;

      const r = await pool.query(insertQ, [
        resolvedAthleteId,
        sample_id || null,
        scheduled_date,
        laboratory || null,
        technician || null,
        chain_of_custody || null,
        user.id
      ]);

      return res.status(201).json(r.rows[0]);
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
