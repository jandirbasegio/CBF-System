import pool from "../../_db.js";
import { verifyToken } from "../../_auth.js";

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  const name = decodeURIComponent(req.query.name);

  const parts = name.trim().split(" ");
  const first = parts.shift();        // primeiro nome
  const last = parts.join(" ");       //

  try {
    // DELETE
    if (req.method === "DELETE") {
      const q = `
        DELETE FROM athletes
        WHERE TRIM(LOWER(first_name)) = TRIM(LOWER($1))
        AND TRIM(LOWER(last_name)) = TRIM(LOWER($2))
      `;

      await pool.query(q, [first, last]);
      return res.json({ message: "Atleta removido" });
    }

    res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
}
