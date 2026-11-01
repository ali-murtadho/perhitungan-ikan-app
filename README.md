# Kalkulator Ikan

Aplikasi pencatatan & penghitungan otomatis bongkar muat pasokan ikan.
Rancangan lengkap: [Perhitungan Ikan/rancangan_sistem_kalkulator_ikan.md](Perhitungan%20Ikan/rancangan_sistem_kalkulator_ikan.md).

- **Frontend:** React + Vite + Tailwind CSS (`src/`)
- **Backend:** Express.js (`server/`), dijalankan sebagai Vercel Serverless Function lewat `api/index.js`
- **Database:** PostgreSQL / Supabase (`server/schema.sql`)
- **Rumus perhitungan:** `shared/calc.js`, dipakai bersama oleh frontend dan backend

## Menjalankan secara lokal

Butuh Node.js 22+ dan PostgreSQL (atau Docker).

```bash
npm install
cp .env.example .env        # sesuaikan DATABASE_URL bila perlu

docker compose up -d        # PostgreSQL lokal; skema dibuat otomatis
# atau, jika memakai PostgreSQL/Supabase sendiri:
npm run db:init

npm run dev                 # API :3001 + web :5173
```

Buka http://localhost:5173. Untuk mencoba dari HP, sambungkan ke Wi-Fi yang sama lalu buka
alamat "Network" yang muncul di terminal.

## Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm test` | Menjalankan unit test rumus perhitungan |
| `npm run build` | Build frontend ke `dist/` |
| `npm start` | Menjalankan server produksi (API + frontend dari `dist/`) |
| `npm run db:init` | Membuat tabel di database (`CREATE TABLE IF NOT EXISTS`) |

## Deploy (Vercel + Supabase)

1. Buat project di Supabase, buka **SQL Editor**, lalu jalankan isi `server/schema.sql`.
2. Ambil connection string di **Connect → Transaction pooler** (port 6543).
3. Import repo ini ke Vercel, lalu tambahkan Environment Variables:
   - `DATABASE_URL` = connection string dari Supabase
   - `DATABASE_SSL` = `true`
4. Deploy. Vercel otomatis menjalankan `npm run build`, dan request `/api/*` diarahkan ke `api/index.js`.

## API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/suppliers` | Daftar pemasok |
| POST | `/api/suppliers` | `{ name, phone_number? }` |
| GET | `/api/transactions` | 50 transaksi terakhir (`?limit=` maks. 200) |
| GET | `/api/transactions/:id` | Detail transaksi + rincian timbangan |
| POST | `/api/transactions` | `{ supplier_id, bucket_weight, price_per_kg, weights: [..] }` |
| DELETE | `/api/transactions/:id` | Hapus transaksi |

Total (kotor, netto, bayar) **selalu dihitung ulang di server**; angka dari klien tidak dipercaya.
Perhitungan memakai bilangan bulat (seperseratus) agar tidak ada selisih pembulatan.

## Fitur

- Pilih pemasok atau tambah pemasok baru langsung dari form
- Input timbangan cepat (tekan Enter), boleh pakai koma atau titik (`21,3`)
- Total berjalan real-time, juga tampil ringkas di header saat menimbang
- Hapus baris yang salah ketik; angka yang jauh berbeda dari mayoritas ditandai "Cek lagi?"
- Draf tersimpan otomatis di HP, jadi data tidak hilang kalau halaman ter-refresh
- Berat ember & harga terakhir diingat untuk transaksi berikutnya
- Struk setelah simpan (bisa dicetak), riwayat transaksi, detail & hapus
- Kirim nota ke WhatsApp beserta proses perhitungannya. Nomor tujuan diatur lewat
  `VITE_WHATSAPP_NUMBER` di `.env` (restart `npm run dev` setelah mengubahnya)
