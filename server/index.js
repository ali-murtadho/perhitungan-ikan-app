import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app } from './app.js';

// Untuk hosting non-Vercel: sajikan hasil build frontend dari server yang sama.
const dist = fileURLToPath(new URL('../dist', import.meta.url));
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile('index.html', { root: dist }));
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
