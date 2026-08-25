const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[db] DATABASE_URL nao definido. Configure o arquivo .env a partir de .env.example.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Erro inesperado no pool de conexoes:', err);
});

module.exports = { pool };
