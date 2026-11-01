const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const kg = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatRupiah = (n) => rupiah.format(n || 0);
export const formatNumber = (n) => kg.format(n || 0);
export const formatKg = (n) => `${formatNumber(n)} Kg`;
export const formatDateTime = (d) => dateTime.format(new Date(d));
