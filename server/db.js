import pg from 'pg';

// DECIMAL (NUMERIC) dikembalikan sebagai string oleh pg; ubah ke number.
// Aman karena presisi kolom maksimal 15 digit.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => (v === null ? null : Number(v)));

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL belum diatur. Salin .env.example menjadi .env.');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Serverless: jaga jumlah koneksi tetap kecil per instance.
  max: Number(process.env.DATABASE_POOL_MAX || 5),
});

/** Menjalankan fn di dalam satu transaksi database (BEGIN/COMMIT/ROLLBACK). */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
