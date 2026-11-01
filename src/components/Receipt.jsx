import { formatDateTime, formatKg, formatRupiah } from '../lib/format.js';

/** Struk / nota transaksi. Data dari API (sudah dihitung ulang oleh server). */
export function Receipt({ trx }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm print:border-0 print:p-0">
      <div className="border-b border-dashed border-slate-300 pb-3 text-center">
        <h3 className="text-base font-black tracking-wide">NOTA PENERIMAAN IKAN</h3>
        <p className="text-xs text-slate-500">{formatDateTime(trx.transaction_date)}</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-400">#{trx.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <dl className="space-y-1 border-b border-dashed border-slate-300 py-3">
        <Row label="Pemasok" value={trx.supplier_name} bold />
        <Row label="Harga / Kg" value={formatRupiah(trx.price_per_kg)} />
        <Row label="Berat ember kosong" value={formatKg(trx.bucket_weight)} />
      </dl>

      {trx.details?.length > 0 && (
        <div className="border-b border-dashed border-slate-300 py-3">
          <p className="mb-2 text-xs font-bold text-slate-500 uppercase">Detail Timbangan</p>
          <ol className="grid grid-cols-3 gap-x-3 gap-y-1 font-mono text-xs">
            {trx.details.map((d) => (
              <li key={d.sequence_number} className="flex justify-between">
                <span className="text-slate-400">{d.sequence_number}.</span>
                <span>{d.gross_weight.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <dl className="space-y-1 py-3">
        <Row label="Total kotor" value={formatKg(trx.total_gross_weight)} />
        <Row
          label={`Potongan ember (${trx.total_weigh_count}×)`}
          value={`− ${formatKg(trx.total_gross_weight - trx.total_net_weight)}`}
        />
        <Row label="Netto" value={formatKg(trx.total_net_weight)} bold />
      </dl>

      <div className="rounded-lg bg-emerald-50 p-3 text-center print:bg-white">
        <div className="text-xs font-bold text-emerald-700 uppercase">Total Bayar</div>
        <div className="text-2xl font-black text-emerald-600 tabular-nums print:text-black">
          {formatRupiah(trx.total_amount)}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${bold ? 'font-bold text-slate-800' : ''}`}>{value}</dd>
    </div>
  );
}
