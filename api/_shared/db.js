import pkg from 'pg';
const { Pool } = pkg;

// Configuração do pool otimizada para serverless (Vercel)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Configurações para serverless - conexões mais curtas
  max: 1, // Máximo de 1 conexão por função serverless
  idleTimeoutMillis: 30000, // Fechar conexões ociosas após 30s
  connectionTimeoutMillis: 10000, // Timeout de conexão de 10s
});
