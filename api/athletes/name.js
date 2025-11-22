import { pool } from "../_shared/db.js";
import { verifyToken } from "../_shared/auth.js";

export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  try {
    // GET - Buscar atleta por nome
    if (req.method === "GET") {
      const name = req.query.name ? decodeURIComponent(req.query.name) : null;
      
      if (!name) {
        return res.status(400).json({ error: "Nome do atleta é obrigatório" });
      }

      const parts = name.trim().split(" ").filter(p => p.length > 0);
      const first = parts[0] || null;
      const last = parts.slice(1).join(" ") || null;

      if (!first) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      let q, params;
      if (last) {
        q = `
          SELECT * FROM athletes
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(last_name)) = LOWER(TRIM($2))
          LIMIT 1
        `;
        params = [first.trim(), last.trim()];
      } else {
        q = `
          SELECT * FROM athletes
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
          AND (last_name IS NULL OR TRIM(last_name) = '')
          LIMIT 1
        `;
        params = [first.trim()];
      }

      const result = await pool.query(q, params);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Atleta não encontrado" });
      }

      return res.status(200).json(result.rows[0]);
    }

    // PUT - Atualizar atleta por nome
    if (req.method === "PUT") {
      const name = req.query.name ? decodeURIComponent(req.query.name) : null;
      
      if (!name) {
        return res.status(400).json({ error: "Nome do atleta é obrigatório" });
      }

      const {
        first_name, last_name, date_of_birth,
        nationality, gender, id_document
      } = req.body;

      if (!first_name || !last_name) {
        return res.status(400).json({ error: "Nome e sobrenome são obrigatórios" });
      }

      const parts = name.trim().split(" ").filter(p => p.length > 0);
      const first = parts[0] || null;
      const last = parts.slice(1).join(" ") || null;

      if (!first) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      // Buscar o atleta atual
      let findQ, findParams;
      if (last) {
        findQ = `
          SELECT id FROM athletes
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
          AND LOWER(TRIM(last_name)) = LOWER(TRIM($2))
          LIMIT 1
        `;
        findParams = [first.trim(), last.trim()];
      } else {
        findQ = `
          SELECT id FROM athletes
          WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
          AND (last_name IS NULL OR TRIM(last_name) = '')
          LIMIT 1
        `;
        findParams = [first.trim()];
      }

      const findResult = await pool.query(findQ, findParams);
      
      if (findResult.rowCount === 0) {
        return res.status(404).json({ error: "Atleta não encontrado" });
      }

      const athleteId = findResult.rows[0].id;

      // Atualizar o atleta
      const updateQ = `
        UPDATE athletes SET
          first_name = $1,
          last_name = $2,
          date_of_birth = $3,
          nationality = $4,
          gender = $5,
          id_document = $6,
          updated_at = now()
        WHERE id = $7
        RETURNING *
      `;

      const updateResult = await pool.query(updateQ, [
        first_name, last_name, date_of_birth || null,
        nationality || null, gender || null, id_document || null, athleteId
      ]);

      return res.status(200).json({ 
        message: "Atleta atualizado com sucesso",
        athlete: updateResult.rows[0]
      });
    }

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
