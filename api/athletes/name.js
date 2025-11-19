import { pool } from "../_shared/db.js";
import { verifyToken } from "../_shared/auth.js";

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  try {
    // DELETE
    if (req.method === "DELETE") {
      const name = req.query.name ? decodeURIComponent(req.query.name) : null;
      
      if (!name) {
        return res.status(400).json({ error: "Nome do atleta é obrigatório" });
      }

      const parts = name.trim().split(" ").filter(p => p.length > 0);
      const first = parts[0] || null;        // primeiro nome
      const last = parts.slice(1).join(" ") || null;       // resto do nome

      if (!first) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      // Query que funciona tanto com sobrenome quanto sem
      let q, params;
      if (last) {
        q = `
          DELETE FROM athletes
          WHERE TRIM(LOWER(first_name)) = TRIM(LOWER($1))
          AND TRIM(LOWER(last_name)) = TRIM(LOWER($2))
        `;
        params = [first, last];
      } else {
        q = `
          DELETE FROM athletes
          WHERE TRIM(LOWER(first_name)) = TRIM(LOWER($1))
          AND (last_name IS NULL OR TRIM(last_name) = '')
        `;
        params = [first];
      }

      const result = await pool.query(q, params);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Atleta não encontrado" });
      }

      return res.status(200).json({ message: "Atleta removido com sucesso" });
    }

    res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error("Erro ao excluir atleta:", err);
    res.status(500).json({ 
      error: "Erro interno",
      message: err.message || String(err)
    });
  }
}
