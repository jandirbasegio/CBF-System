import { pool } from '../_shared/db.js';
import { authenticate, authorize } from '../_shared/auth.js';

export default async function handler(req, res) {
  try {
    await authenticate(req);
    await authorize(req, ['cbf_staff','admin']);
    const athletes = await pool.query('SELECT COUNT(*) FROM athletes');
    const tests = await pool.query('SELECT COUNT(*) FROM tests');
    const positives = await pool.query("SELECT COUNT(*) FROM test_results WHERE result='positive'");
    res.json({ athletes: Number(athletes.rows[0].count), tests: Number(tests.rows[0].count), positives: Number(positives.rows[0].count) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || String(err) });
  }
}
