// Aturan perhitungan bisnis. Dipakai oleh frontend (real-time) dan backend
// (sumber kebenaran saat menyimpan), sehingga hasilnya selalu identik.
//
// Semua angka dihitung dalam satuan seperseratus (bilangan bulat) agar tidak
// terjadi selisih pembulatan floating point, misal 0.1 + 0.2 = 0.30000000000000004.

const toHundredths = (n) => Math.round(Number(n) * 100);

/** Mengubah input pengguna ("21,3" atau "21.3") menjadi angka, atau NaN. */
export function parseDecimal(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').trim().replace(',', '.');
  if (cleaned === '' || !/^\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

/**
 * 1. Total Potongan Ember = Jumlah Menimbang × Berat 1 Ember Kosong
 * 2. Total Netto Ikan     = Total Timbangan Kotor − Total Potongan Ember
 * 3. Total Bayar          = Total Netto Ikan × Harga per Kg
 */
export function calculateSummary(weights, bucketWeight, pricePerKg) {
  const count = weights.length;
  const gross = weights.reduce((sum, w) => sum + toHundredths(w), 0);
  const deduction = toHundredths(bucketWeight || 0) * count;
  const net = gross - deduction;
  // net (kg×100) × harga (Rp×100) = Rp×10000 → dibagi 100 agar menjadi Rp×100
  const amount = Math.round((net * toHundredths(pricePerKg || 0)) / 100);

  return {
    count,
    totalGross: gross / 100,
    totalDeduction: deduction / 100,
    totalNet: net / 100,
    totalAmount: amount / 100,
  };
}

export const LIMITS = {
  maxGrossWeight: 999.99, // DECIMAL(5,2)
  maxBucketWeight: 999.99, // DECIMAL(5,2)
  maxPricePerKg: 10_000_000,
  maxWeighings: 1000,
};
