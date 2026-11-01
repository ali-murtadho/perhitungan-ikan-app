# Dokumen Rancangan Sistem: Aplikasi Kalkulator Ikan

Dokumen ini berisi spesifikasi teknis, mekanisme bisnis, dan rancangan arsitektur untuk aplikasi "Kalkulator Ikan", sebuah sistem pencatatan dan penghitungan otomatis untuk bongkar muat pasokan ikan.

## 1. Tech Stack (Pilihan Teknologi)

Pendekatan utama untuk sistem ini adalah **Serverless & SPA (Single Page Application)** untuk memastikan biaya operasional yang sangat rendah, performa tinggi, dan kemudahan akses di perangkat seluler (HP).

* **Frontend (Antarmuka Pengguna):** React.js (menggunakan Vite) dipadukan dengan Tailwind CSS.

  * *Kelebihan:* Ringan, sangat responsif untuk HP, dan mudah diubah menjadi PWA (Progressive Web App).

* **Backend (API & Logika Bisnis):** Node.js dengan framework Express.js atau menggunakan serverless API dari Next.js.

  * *Kelebihan:* Menggunakan ekosistem JavaScript dari ujung ke ujung.

* **Database:** PostgreSQL (Relational Database).

  * *Kelebihan:* Sangat handal untuk menangani data transaksional yang saling berelasi.

## 2. Alur Pengguna (User Flow)

Alur pengguna dirancang untuk situasi lapangan yang serba cepat. Berikut adalah langkah-langkah praktis (naratif) bagaimana operator/pemilik berinteraksi dengan aplikasi:

### Langkah 1: Persiapan (Setup Kedatangan)

* Saat truk/pickup pemasok tiba, pengguna membuka aplikasi.

* Pengguna memilih nama distributor/pemasok dari daftar.

* Pengguna memasukkan **Berat 1 Ember Kosong** (misal: 1.5 Kg) dan **Harga Kesepakatan per Kg** pada hari itu (misal: Rp 25.000).

### Langkah 2: Proses Penimbangan (Iterasi Cepat)

* Pemasok mulai menimbang ember berisi ikan ke atas timbangan.

* Pengguna melihat angka di timbangan (misal: 21.3 Kg) lalu mengetikkannya ke aplikasi dan menekan "Tambah" (atau *Enter*).

* Aplikasi **secara instan** menampilkan angka riwayat di bawahnya dan otomatis menghitung total berjalan (tanpa perlu *loading* halaman).

* Proses ini diulang terus menerus setiap kali ember baru ditimbang.

### Langkah 3: Validasi & Koreksi

* Jika terjadi salah ketik (misal: tertulis 222 Kg padahal harusnya 22 Kg), pengguna cukup menekan tombol "Hapus" pada baris yang salah di daftar riwayat.

* Sistem otomatis merevisi total potongan ember dan harga keseluruhan dalam sepersekian detik.

### Langkah 4: Penyelesaian (Checkout)

* Setelah semua ikan selesai diturunkan, pengguna dan supir pemasok bisa melihat ringkasan final bersama-sama di layar HP (Total kotor, Potongan ember, Netto, dan Total Uang).

* Pengguna menekan tombol "Simpan Transaksi".

* Sistem membersihkan layar dan siap untuk transaksi berikutnya. Data aman tersimpan di *database* cloud.

### Diagram Alur (Flowchart)

```
flowchart TD
    A[Buka Aplikasi di HP/Browser] --> B[Pilih Pemasok/Distributor]
    B --> C[Input: Berat Ember Kosong & Harga per Kg]
    C --> D{Mulai Menimbang?}
    
    D -- "Ya (Ada Ember Masuk)" --> E[Input: Berat Kotor Ember]
    E --> F[Klik Tombol 'Tambah']
    F --> G[Sistem Update Ringkasan:\nNetto & Total Harga Real-time]
    G --> D
    
    D -- "Selesai (Semua Ember Ditimbang)" --> H[Review Ringkasan Final bersama Pemasok]
    H --> I[Klik Tombol 'Simpan Transaksi']
    I --> J{Validasi Data}
    
    J -- Gagal --> K[Tampilkan Pesan Error]
    K --> H
    
    J -- Berhasil --> L[Kirim Data ke API (Server)]
    L --> M[Simpan ke Database PostgreSQL]
    M --> N[Tampilkan Struk/Notifikasi Sukses & Reset Form]

```

## 3. Mekanisme Bisnis & Aturan Perhitungan

Aplikasi ini tidak sekadar alat hitung, tetapi juga menerapkan aturan bisnis (Business Logic) yang memastikan keadilan dan efisiensi operasional bagi pemilik pemancingan.

### A. Aturan Perhitungan (Kalkulasi Matematis)

Sistem menggunakan rumus absolut untuk menghindari selisih perhitungan manusia:

1. **Total Potongan Ember** = Jumlah Menimbang × Berat 1 Ember Kosong.

2. **Total Netto Ikan** = Total Timbangan Kotor - Total Potongan Ember.

3. **Total Bayar** = Total Netto Ikan × Harga per Kg.

### B. Nilai Bisnis (Business Value)

* **Kecepatan & Kelangsungan Hidup Ikan:** Menimbang ikan secara manual memakan waktu. Semakin lama ikan di darat/ember, stres dan risiko kematian ikan meningkat. Aplikasi ini memangkas waktu hitung drastis sehingga ikan bisa langsung masuk ke kolam.

* **Transparansi Kemitraan:** Seringkali terjadi perdebatan perhitungan antara supir pemasok dan pihak pemancingan. Dengan layar hasil yang *real-time*, kedua belah pihak mendapatkan validasi seketika (trust-building).

* **Manajemen Harga Pokok (HPP):** Dengan tercatatnya total harga dan berat netto per transaksi di *database*, pemilik bisa dengan mudah menghitung Harga Pokok Penjualan (HPP) untuk menentukan harga tiket pemancingan harian atau sistem kiloan agar tetap profit.

## 4. Desain Arsitektur Infrastruktur

Arsitektur dirancang agar ringan (tidak membebani server secara terus-menerus) dan *scalable*. Menggunakan model *Cloud Native* / *Serverless*.

```
architecture-beta
    group client(cloud)[Client Side]
    group cloud(cloud)[Cloud Infrastructure]
    group dbGroup(database)[Database Provider]

    service user(internet)[Operator (HP)] in client
    service frontend(server)[Vercel: Frontend UI] in cloud
    service api(server)[Vercel: Serverless API] in cloud
    service db(database)[Supabase: PostgreSQL] in dbGroup

    user:R --> L:frontend
    frontend:R --> L:api
    api:R --> L:db

```

## 5. Desain Database (Skema Relasional)

Sistem akan menggunakan 3 tabel utama:

### A. Tabel `suppliers` (Data Pemasok)

| Kolom | Tipe Data | Keterangan | 
 | ----- | ----- | ----- | 
| `id` | UUID / SERIAL | Primary Key | 
| `name` | VARCHAR(100) | Nama pemasok/distributor | 
| `phone_number` | VARCHAR(20) | Nomor kontak (opsional) | 
| `created_at` | TIMESTAMP | Waktu data ditambahkan | 

### B. Tabel `transactions` (Header Transaksi/Nota)

| Kolom | Tipe Data | Keterangan | 
 | ----- | ----- | ----- | 
| `id` | UUID / SERIAL | Primary Key | 
| `supplier_id` | UUID / INT | Foreign Key -> `suppliers.id` | 
| `transaction_date` | TIMESTAMP | Waktu transaksi dilakukan | 
| `bucket_weight` | DECIMAL(5,2) | Berat 1 ember kosong (Kg) | 
| `price_per_kg` | DECIMAL(12,2) | Harga per Kg kesepakatan | 
| `total_weigh_count` | INT | Jumlah berapa kali menimbang | 
| `total_gross_weight` | DECIMAL(10,2) | Total berat kotor keseluruhan (Kg) | 
| `total_net_weight` | DECIMAL(10,2) | Total berat bersih ikan (Netto) (Kg) | 
| `total_amount` | DECIMAL(15,2) | Total nominal yang harus dibayarkan (Rp) | 

### C. Tabel `weighing_details` (Detail Timbangan)

| Kolom | Tipe Data | Keterangan | 
 | ----- | ----- | ----- | 
| `id` | UUID / SERIAL | Primary Key | 
| `transaction_id` | UUID / INT | Foreign Key -> `transactions.id` | 
| `sequence_number` | INT | Urutan timbangan (ke-1, ke-2, dst) | 
| `gross_weight` | DECIMAL(5,2) | Berat kotor pada timbangan tersebut (Kg) | 

## 6. Rekomendasi Fitur Lanjutan (Roadmap)

1. **Cetak Struk Bluetooth (Thermal Printer):** Menghubungkan aplikasi web dengan Web Bluetooth API untuk mencetak nota fisik.

2. **Dashboard Analitik:** Grafik harian/bulanan total ikan yang masuk, pengeluaran, dan performa *supplier*.

3. **Mode Offline Penuh (PWA):** Menyimpan data sementara di *Local Storage* saat sinyal buruk, dan otomatis sinkronisasi ke server saat koneksi pulih.