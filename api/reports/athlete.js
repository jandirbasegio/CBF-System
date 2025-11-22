import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';

export default async function handler(req, res) {
  console.log('API /api/reports/athlete chamada, método:', req.method);
  console.log('Query params:', req.query);
  
  try {
    // Autenticação e autorização
    try {
      await authenticate(req);
    } catch (authErr) {
      console.log('Erro de autenticação:', authErr);
      return res.status(authErr.status || 401).json({ 
        error: authErr.message || 'Token inválido' 
      });
    }

    try {
      await authorize(req, ['cbf_staff','admin']);
    } catch (authErr) {
      return res.status(authErr.status || 403).json({ 
        error: authErr.message || 'Acesso negado' 
      });
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const athleteName = req.query.name;
    if (!athleteName) {
      return res.status(400).json({ error: 'Nome do atleta é obrigatório' });
    }

    // Buscar atleta por nome
    const parts = athleteName.trim().split(' ').filter(p => p.length > 0);
    const first = parts[0] || null;
    const last = parts.slice(1).join(' ') || null;

    if (!first) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    let athleteQuery, athleteParams;
    if (last) {
      athleteQuery = `
        SELECT * FROM athletes
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
        AND LOWER(TRIM(last_name)) = LOWER(TRIM($2))
        LIMIT 1
      `;
      athleteParams = [first.trim(), last.trim()];
    } else {
      athleteQuery = `
        SELECT * FROM athletes
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM($1))
        AND (last_name IS NULL OR TRIM(last_name) = '')
        LIMIT 1
      `;
      athleteParams = [first.trim()];
    }

    const athleteResult = await pool.query(athleteQuery, athleteParams);
    
    if (athleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Atleta não encontrado' });
    }

    const athlete = athleteResult.rows[0];

    // Buscar testes do atleta
    const testsResult = await pool.query(`
      SELECT 
        t.id,
        t.athlete_id,
        t.sample_id,
        t.scheduled_date,
        t.collected_date,
        t.laboratory,
        t.technician,
        t.chain_of_custody,
        t.status,
        t.created_by,
        t.created_at,
        t.updated_at,
        COUNT(tr.id) as results_count
      FROM tests t
      LEFT JOIN test_results tr ON tr.test_id = t.id
      WHERE t.athlete_id = $1
      GROUP BY t.id, t.athlete_id, t.sample_id, t.scheduled_date, t.collected_date, 
               t.laboratory, t.technician, t.chain_of_custody, t.status, 
               t.created_by, t.created_at, t.updated_at
      ORDER BY t.scheduled_date DESC
    `, [athlete.id]);

    // Buscar resultados do atleta
    const resultsQuery = await pool.query(`
      SELECT tr.*, t.sample_id, t.scheduled_date, t.laboratory
      FROM test_results tr
      LEFT JOIN tests t ON t.id = tr.test_id
      WHERE t.athlete_id = $1
      ORDER BY tr.reported_at DESC
    `, [athlete.id]);

    // Estatísticas
    const totalTests = testsResult.rowCount;
    const totalResults = resultsQuery.rowCount;
    const positiveResults = resultsQuery.rows.filter(r => 
      r.result && (r.result.toLowerCase() === 'positive' || r.result.toLowerCase() === 'positivo')
    ).length;
    const negativeResults = totalResults - positiveResults;

    res.json({
      athlete: {
        id: athlete.id,
        first_name: athlete.first_name,
        last_name: athlete.last_name,
        date_of_birth: athlete.date_of_birth,
        nationality: athlete.nationality,
        gender: athlete.gender,
        id_document: athlete.id_document
      },
      statistics: {
        total_tests: totalTests,
        total_results: totalResults,
        positive_results: positiveResults,
        negative_results: negativeResults
      },
      tests: testsResult.rows,
      results: resultsQuery.rows
    });
  } catch (err) {
    console.error('Erro ao buscar relatório do atleta:', err);
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}

