// /api/tests/id.js
import { pool } from "../_shared/db.js";
import { verifyToken } from "../_shared/auth.js";

/**
 * DELETE /api/tests/id?id=... -> exclui teste
 */
export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  const id = req.query.id;

  try {
    if (req.method === "DELETE") {
      if (!id) {
        return res.status(400).json({ error: "ID do teste é obrigatório" });
      }

      // Verificar se o teste existe
      const checkResult = await pool.query('SELECT id FROM tests WHERE id = $1', [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({ error: "Teste não encontrado" });
      }

      // Excluir o teste (CASCADE vai excluir resultados relacionados automaticamente)
      const result = await pool.query('DELETE FROM tests WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Teste não encontrado" });
      }

      return res.status(200).json({ message: "Teste removido com sucesso" });
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("Erro ao excluir teste:", err);
    res.status(500).json({ 
      error: "Erro interno",
      message: err.message || String(err)
    });
  }
}

