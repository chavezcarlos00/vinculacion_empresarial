require('dotenv').config();
const { Pool } = require('pg');

console.log("🔌 Intentando conexión a PostgreSQL con:");
console.log("🧑 Usuario:", process.env.DB_USER);
console.log("📂 Base de datos:", process.env.DB_NAME);

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000
      }
    : {
        host:     process.env.DB_HOST,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port:     process.env.DB_PORT || 5432,
        max: 10,
        idleTimeoutMillis: 30000
      }
);

pool.on('connect', (client) => {
  console.log(`✅ Nueva conexión establecida`);
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el cliente PostgreSQL:', err);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    await client.query('SELECT 1');
    console.log('✅ Ping exitoso a la base de datos');
    client.release();
  } catch (err) {
    console.error('❌ Fallo de conexión:', err.message);
  }
};

const query = async (sql, params = []) => {
  try {
    let pgSql = sql;
    let paramIndex = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
    pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%d\/%m\/%Y'\)/gi, "TO_CHAR($1, 'DD/MM/YYYY')");

    console.log("🔎 Ejecutando SQL:", pgSql);
    console.log("📦 Con parámetros:", params);

    const result = await pool.query(pgSql, params);
    return result.rows;
  } catch (err) {
    console.error('❌ Error en la consulta SQL:');
    console.error("📝 SQL:", sql);
    console.error("📦 Params:", params);
    console.error("🧨 Error:", err);
    throw err;
  }
};

testConnection();

const getClient = () => pool.connect();

module.exports = {
  query,
  pool,
  getClient
};
