import pool from "../../_db.js";
import { verifyToken } from "../../_auth.js";

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const search = req.query.search || "";

      const q = `
        SELECT * FROM athletes
        WHERE LOWER(first_name || ' ' || last_name) LIKE LOWER($1)
        ORDER BY first_name
      `;

      const r = await pool.query(q, ["%" + search + "%"]);
      return res.status(200).json(r.rows);
    }

    if (req.method === "POST") {
      const {
        first_name, last_name, date_of_birth,
        nationality, gender, id_document
      } = req.body;

      const insert = `
        INSERT INTO athletes (first_name, last_name, date_of_birth,
        nationality, gender, id_document, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `;

      await pool.query(insert, [
        first_name, last_name, date_of_birth,
        nationality, gender, id_document, user.id
      ]);

      return res.json({ message: "Atleta cadastrado com sucesso" });
    }

    res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
