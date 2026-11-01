import express from 'express';
import { pool, withTransaction } from './db.js';
import { calculateSummary, parseDecimal, LIMITS } from '../shared/calc.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class ValidationError extends Error {
  status = 400;
}

function fail(message) {
  throw new ValidationError(message);
}

function requireUuid(value, label) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) fail(`${label} tidak valid.`);
  return value;
}

export const app = express();
app.use(express.json({ limit: '100kb' }));

const api = express.Router();

api.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

// ---------- Pemasok ----------

api.get('/suppliers', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, phone_number, created_at FROM suppliers ORDER BY name ASC',
  );
  res.json(rows);
});

api.post('/suppliers', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const phone = String(req.body?.phone_number ?? '').trim() || null;
  if (!name) fail('Nama pemasok wajib diisi.');
  if (name.length > 100) fail('Nama pemasok maksimal 100 karakter.');
  if (phone && phone.length > 20) fail('Nomor telepon maksimal 20 karakter.');

  const { rows } = await pool.query(
    `INSERT INTO suppliers (name, phone_number) VALUES ($1, $2)
     RETURNING id, name, phone_number, created_at`,
    [name, phone],
  );
  res.status(201).json(rows[0]);
});

// ---------- Transaksi ----------

const TRANSACTION_COLUMNS = `
  t.id, t.supplier_id, s.name AS supplier_name, t.transaction_date,
  t.bucket_weight, t.price_per_kg, t.total_weigh_count,
  t.total_gross_weight, t.total_net_weight, t.total_amount`;

api.get('/transactions', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const { rows } = await pool.query(
    `SELECT ${TRANSACTION_COLUMNS}
     FROM transactions t JOIN suppliers s ON s.id = t.supplier_id
     ORDER BY t.transaction_date DESC
     LIMIT $1`,
    [limit],
  );
  res.json(rows);
});

async function getTransaction(id, db = pool) {
  const { rows } = await db.query(
    `SELECT ${TRANSACTION_COLUMNS}
     FROM transactions t JOIN suppliers s ON s.id = t.supplier_id
     WHERE t.id = $1`,
    [id],
  );
  if (!rows[0]) return null;
  const details = await db.query(
    `SELECT sequence_number, gross_weight FROM weighing_details
     WHERE transaction_id = $1 ORDER BY sequence_number ASC`,
    [id],
  );
  return { ...rows[0], details: details.rows };
}

api.get('/transactions/:id', async (req, res) => {
  const trx = await getTransaction(requireUuid(req.params.id, 'ID transaksi'));
  if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  res.json(trx);
});

api.post('/transactions', async (req, res) => {
  const body = req.body ?? {};
  const supplierId = requireUuid(body.supplier_id, 'Pemasok');

  const bucketWeight = parseDecimal(body.bucket_weight);
  if (!Number.isFinite(bucketWeight) || bucketWeight < 0 || bucketWeight > LIMITS.maxBucketWeight) {
    fail('Berat ember kosong tidak valid.');
  }

  const pricePerKg = parseDecimal(body.price_per_kg);
  if (!Number.isFinite(pricePerKg) || pricePerKg <= 0 || pricePerKg > LIMITS.maxPricePerKg) {
    fail('Harga per Kg tidak valid.');
  }

  if (!Array.isArray(body.weights) || body.weights.length === 0) {
    fail('Belum ada data timbangan.');
  }
  if (body.weights.length > LIMITS.maxWeighings) fail('Jumlah timbangan terlalu banyak.');

  const weights = body.weights.map((w, i) => {
    const n = parseDecimal(w);
    if (!Number.isFinite(n) || n <= 0 || n > LIMITS.maxGrossWeight) {
      fail(`Timbangan ke-${i + 1} tidak valid.`);
    }
    return n;
  });

  // Total dihitung ulang di server; angka dari klien tidak dipercaya.
  const summary = calculateSummary(weights, bucketWeight, pricePerKg);
  if (summary.totalNet <= 0) {
    fail('Netto bernilai nol atau negatif. Periksa kembali berat ember kosong.');
  }

  const created = await withTransaction(async (db) => {
    const supplier = await db.query('SELECT 1 FROM suppliers WHERE id = $1', [supplierId]);
    if (supplier.rowCount === 0) fail('Pemasok tidak ditemukan.');

    const { rows } = await db.query(
      `INSERT INTO transactions
         (supplier_id, bucket_weight, price_per_kg, total_weigh_count,
          total_gross_weight, total_net_weight, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        supplierId, bucketWeight, pricePerKg, summary.count,
        summary.totalGross, summary.totalNet, summary.totalAmount,
      ],
    );
    const trxId = rows[0].id;

    // Satu INSERT untuk semua baris detail.
    await db.query(
      `INSERT INTO weighing_details (transaction_id, sequence_number, gross_weight)
       SELECT $1, s.seq, s.w
       FROM unnest($2::int[], $3::numeric[]) AS s(seq, w)`,
      [trxId, weights.map((_, i) => i + 1), weights],
    );

    return getTransaction(trxId, db);
  });

  res.status(201).json(created);
});

api.delete('/transactions/:id', async (req, res) => {
  const id = requireUuid(req.params.id, 'ID transaksi');
  const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
  res.status(204).end();
});

app.use('/api', api);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

// Express 5 meneruskan error dari handler async ke sini secara otomatis.
app.use((err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Format data tidak valid.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server. Coba lagi.' });
});
