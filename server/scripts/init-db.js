import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';

const sql = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
try {
  await pool.query(sql);
  console.log('Skema database berhasil dibuat / sudah ada.');
} catch (err) {
  console.error('Gagal membuat skema:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
