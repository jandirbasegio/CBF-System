import { pool } from "../_shared/db.js";
import { verifyToken } from "../_shared/auth.js";

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

      // Validação básica
      if (!first_name || !last_name) {
        return res.status(400).json({ error: "Nome e sobrenome são obrigatórios" });
      }

      const insert = `
        INSERT INTO athletes (first_name, last_name, date_of_birth,
        nationality, gender, id_document, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id
      `;

      const result = await pool.query(insert, [
        first_name, last_name, date_of_birth || null,
        nationality || null, gender || null, id_document || null, user.id
      ]);

      return res.status(201).json({ 
        message: "Atleta cadastrado com sucesso",
        id: result.rows[0]?.id
      });
    }

    res.status(405).json({ error: "Método não permitido" });

  } catch (err) {
    console.error("Erro em /api/athletes:", err);
    
    // Erros específicos do PostgreSQL
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ 
        error: "Documento já cadastrado",
        message: "Já existe um atleta com este documento"
      });
    }
    
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        error: "Dados inválidos",
        message: "Referência inválida"
      });
    }
    
    res.status(500).json({ 
      error: "Erro interno", 
      message: err.message || String(err),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
