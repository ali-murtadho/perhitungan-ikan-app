import { Calculator } from 'lucide-react';
import { formatKg, formatRupiah } from '../lib/format.js';

export function SummaryCard({ summary }) {
  const negative = summary.totalNet < 0;

  return (
    <section className="card border-t-4 border-t-emerald-500">
      <h2 className="card-title">
        <Calculator className="size-4" /> Ringkasan Akhir
      </h2>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-slate-600">Total Kotor</dt>
          <dd className="font-semibold">{formatKg(summary.totalGross)}</dd>
        </div>
        <div className="flex justify-between py-1 text-red-500">
          <dt>Potongan Ember ({summary.count}×)</dt>
          <dd className="font-semibold">− {formatKg(summary.totalDeduction)}</dd>
        </div>
        <hr className="my-2 border-slate-200" />
        <div className="flex justify-between py-1 text-base">
          <dt className="font-bold text-slate-800">Netto (Berat Bersih)</dt>
          <dd className={`font-black ${negative ? 'text-red-600' : 'text-blue-600'}`}>{formatKg(summary.totalNet)}</dd>
        </div>
      </dl>

      {negative && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
          Netto negatif: berat ember kosong lebih besar dari timbangan. Periksa kembali.
        </p>
      )}

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
        <div className="mb-1 text-xs font-bold text-emerald-700 uppercase">Total Bayar</div>
        <div className="truncate text-3xl font-black text-emerald-600 tabular-nums">
          {formatRupiah(Math.max(0, summary.totalAmount))}
        </div>
      </div>
    </section>
  );
}
