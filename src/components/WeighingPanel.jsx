import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Plus, Scale, X } from 'lucide-react';
import { LIMITS, parseDecimal } from '../../shared/calc.js';
import { formatKg } from '../lib/format.js';

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function WeighingPanel({ weights, onAdd, onRemove }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Tandai angka yang jauh berbeda dari mayoritas (kemungkinan salah ketik, misal 222 vs 22).
  const typical = useMemo(() => (weights.length >= 3 ? median(weights) : null), [weights]);
  const isSuspicious = (w) => typical !== null && (w > typical * 2 || w < typical / 2);

  function handleAdd(e) {
    e.preventDefault();
    const n = parseDecimal(value);
    if (!Number.isFinite(n) || n <= 0) {
      setError('Masukkan angka timbangan yang valid.');
    } else if (n > LIMITS.maxGrossWeight) {
      setError(`Maksimal ${LIMITS.maxGrossWeight} Kg per timbangan.`);
    } else {
      onAdd(Math.round(n * 100) / 100);
      setValue('');
      setError('');
    }
    inputRef.current?.focus();
  }

  return (
    <section className="card">
      <h2 className="card-title">
        <Scale className="size-4" /> Input Timbangan
      </h2>

      <form onSubmit={handleAdd} className="mb-2 flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError('');
            }}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            placeholder="Berat kotor"
            aria-label="Berat kotor timbangan (Kg)"
            className="input pr-10 text-xl font-bold"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-medium text-slate-400">
            Kg
          </span>
        </div>
        <button
          type="submit"
          className="flex min-w-[110px] items-center justify-center gap-1 rounded-lg bg-blue-600 px-5 font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
        >
          <Plus className="size-5" /> Tambah
        </button>
      </form>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-300 bg-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
          Riwayat Timbangan Saat Ini ({weights.length})
        </div>
        {weights.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-400 italic">Belum ada data timbangan.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto">
            {weights
              .map((w, i) => ({ w, i }))
              .reverse()
              .map(({ w, i }) => {
                const suspicious = isSuspicious(w);
                return (
                  <li
                    key={i}
                    className={`flex items-center justify-between py-1 pr-1 pl-3 ${suspicious ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-700">{formatKg(w)}</span>
                      {suspicious && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <AlertTriangle className="size-3.5" /> Cek lagi?
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(i)}
                      className="rounded-lg p-3 text-red-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Hapus timbangan ke-${i + 1}`}
                    >
                      <X className="size-5" />
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </section>
  );
}
