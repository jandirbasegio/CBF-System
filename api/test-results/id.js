// /api/test-results/[id].js
import { pool } from "../_shared/db.js";
import { verifyToken } from "../_shared/auth.js";

/**
 * DELETE /api/test-results/:id  -> exclui resultado de teste
 */
export default async function handler(req, res) {
  const user = await verifyToken(req, res);
  if (!user) return;

  const id = req.query.id;

  try {
    if (req.method === "DELETE") {
      if (!id) {
        return res.status(400).json({ error: "ID do resultado é obrigatório" });
      }

      // Verificar se o resultado existe
      const checkResult = await pool.query(
        'SELECT test_id FROM test_results WHERE id = $1',
        [id]
      );

      if (checkResult.rowCount === 0) {
        return res.status(404).json({ error: "Resultado não encontrado" });
      }

      const test_id = checkResult.rows[0].test_id;

      // Excluir o resultado
      const result = await pool.query('DELETE FROM test_results WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Resultado não encontrado" });
      }

      // Atualizar status do teste para 'pending' se não houver mais resultados
      const remainingResults = await pool.query(
        'SELECT COUNT(*) FROM test_results WHERE test_id = $1',
        [test_id]
      );

      if (parseInt(remainingResults.rows[0].count) === 0) {
        await pool.query(
          "UPDATE tests SET status = 'pending', updated_at = now() WHERE id = $1",
          [test_id]
        );
      }

      return res.status(200).json({ message: "Resultado removido com sucesso" });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("Erro em /api/test-results/:id:", err);
    res.status(500).json({ 
      error: "Erro interno",
      message: err.message || String(err)
    });
  }
}

