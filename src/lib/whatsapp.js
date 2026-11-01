import { formatDateTime, formatNumber, formatRupiah } from './format.js';

/** "0878-777 77" / "+62878..." → "62878..." (format internasional untuk wa.me). */
export function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/** Pesan nota beserta proses perhitungannya, memakai format tebal WhatsApp (*teks*). */
export function buildReceiptMessage(trx) {
  const count = trx.total_weigh_count;
  const deduction = trx.total_gross_weight - trx.total_net_weight;
  const weights = trx.details.map((d) => formatNumber(d.gross_weight));

  return [
    '*NOTA PENERIMAAN IKAN*',
    `No: #${trx.id.slice(0, 8).toUpperCase()}`,
    `Tanggal: ${formatDateTime(trx.transaction_date)}`,
    `Pemasok: ${trx.supplier_name}`,
    '',
    `*Detail Timbangan (${count}×):*`,
    ...weights.map((w, i) => `${i + 1}. ${w} Kg`),
    '',
    '*Perhitungan:*',
    `Total Kotor = ${weights.join(' + ')} = ${formatNumber(trx.total_gross_weight)} Kg`,
    `Potongan Ember = ${count} × ${formatNumber(trx.bucket_weight)} Kg = ${formatNumber(deduction)} Kg`,
    `Netto = ${formatNumber(trx.total_gross_weight)} Kg − ${formatNumber(deduction)} Kg = ${formatNumber(trx.total_net_weight)} Kg`,
    `Total Bayar = ${formatNumber(trx.total_net_weight)} Kg × ${formatRupiah(trx.price_per_kg)} = *${formatRupiah(trx.total_amount)}*`,
  ].join('\n');
}

/** Link wa.me. Tanpa nomor, WhatsApp akan meminta pengguna memilih kontak. */
export function buildWhatsAppUrl(phone, text) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}
