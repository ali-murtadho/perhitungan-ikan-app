import { useEffect, useState } from 'react';
import { ChevronRight, FolderOpen, ListChecks, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatDateTime, formatKg, formatRupiah } from '../lib/format.js';
import { Sheet } from './Sheet.jsx';

export function HistorySheet({ open, onClose, onSelect, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getTransactions()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey]);

  return (
    <Sheet open={open} onClose={onClose} title="Riwayat Transaksi" icon={ListChecks}>
      {loading && items.length === 0 ? (
        <div className="flex justify-center p-8 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="p-6 text-center text-slate-400 italic">
          <FolderOpen className="mx-auto mb-3 size-10 opacity-50" />
          Belum ada riwayat transaksi tersimpan.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((trx) => (
            <li key={trx.id}>
              <button
                onClick={() => onSelect(trx.id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">{trx.supplier_name}</h3>
                    <p className="text-xs text-slate-500">{formatDateTime(trx.transaction_date)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                      {trx.total_weigh_count} Ember
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-slate-50 p-2">
                    <span className="block text-xs text-slate-500">Netto Ikan</span>
                    <span className="font-bold text-slate-700">{formatKg(trx.total_net_weight)}</span>
                  </div>
                  <div className="rounded bg-emerald-50 p-2">
                    <span className="block text-xs text-emerald-600">Total Bayar</span>
                    <span className="font-bold text-emerald-700">{formatRupiah(trx.total_amount)}</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
