import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eraser, Fish, History, Loader2, Printer, Save, Send, Trash2, Truck } from 'lucide-react';
import { calculateSummary, LIMITS, parseDecimal } from '../shared/calc.js';
import { api } from './lib/api.js';
import { formatKg, formatRupiah } from './lib/format.js';
import { useLocalStorage } from './lib/useLocalStorage.js';
import { buildReceiptMessage, buildWhatsAppUrl } from './lib/whatsapp.js';
import { SupplierPicker } from './components/SupplierPicker.jsx';
import { WeighingPanel } from './components/WeighingPanel.jsx';
import { SummaryCard } from './components/SummaryCard.jsx';
import { HistorySheet } from './components/HistorySheet.jsx';
import { Receipt } from './components/Receipt.jsx';
import { Sheet } from './components/Sheet.jsx';

// Draf disimpan di localStorage agar data timbangan tidak hilang
// jika halaman ter-refresh atau HP terkunci di tengah penimbangan.
const EMPTY_DRAFT = { supplierId: '', bucketWeight: '', pricePerKg: '', weights: [] };

// Nomor tujuan nota WhatsApp, diatur lewat VITE_WHATSAPP_NUMBER di .env.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

export default function App() {
  const [draft, setDraft] = useLocalStorage('kalkulator-ikan:draft', EMPTY_DRAFT);
  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  // receipt = { trx, fromHistory }
  const [receipt, setReceipt] = useState(null);

  const loadSuppliers = useCallback(() => {
    setSuppliersLoading(true);
    setSuppliersError('');
    api
      .getSuppliers()
      .then(setSuppliers)
      .catch((err) => setSuppliersError(err.message))
      .finally(() => setSuppliersLoading(false));
  }, []);

  useEffect(loadSuppliers, [loadSuppliers]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const bucketWeight = parseDecimal(draft.bucketWeight);
  const pricePerKg = parseDecimal(draft.pricePerKg);
  const summary = useMemo(
    () => calculateSummary(draft.weights, bucketWeight || 0, pricePerKg || 0),
    [draft.weights, bucketWeight, pricePerKg],
  );

  function validate() {
    if (!draft.supplierId) return 'Pilih pemasok terlebih dahulu.';
    if (!Number.isFinite(bucketWeight) || bucketWeight < 0 || bucketWeight > LIMITS.maxBucketWeight)
      return 'Isi berat ember kosong dengan benar.';
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0 || pricePerKg > LIMITS.maxPricePerKg)
      return 'Isi harga per Kg dengan benar.';
    if (draft.weights.length === 0) return 'Belum ada data timbangan.';
    if (summary.totalNet <= 0) return 'Netto bernilai nol atau negatif. Periksa berat ember kosong.';
    return '';
  }

  async function handleSave() {
    const error = validate();
    setSaveError(error);
    if (error) return;

    setSaving(true);
    try {
      const trx = await api.createTransaction({
        supplier_id: draft.supplierId,
        bucket_weight: bucketWeight,
        price_per_kg: pricePerKg,
        weights: draft.weights,
      });
      // Bersihkan layar untuk transaksi berikutnya; berat ember & harga tetap diingat.
      update({ supplierId: '', weights: [] });
      setReceipt({ trx, fromHistory: false });
      setHistoryKey((k) => k + 1);
      setToast('Transaksi berhasil disimpan!');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (draft.weights.length > 0 && !confirm('Batalkan perhitungan saat ini? Semua data timbangan akan dihapus.')) return;
    update({ supplierId: '', weights: [] });
    setSaveError('');
  }

  async function openTransaction(id) {
    try {
      setReceipt({ trx: await api.getTransaction(id), fromHistory: true });
    } catch (err) {
      setToast(err.message);
    }
  }

  async function deleteTransaction(trx) {
    if (!confirm(`Hapus transaksi ${trx.supplier_name} (${formatRupiah(trx.total_amount)})? Data tidak bisa dikembalikan.`)) return;
    try {
      await api.deleteTransaction(trx.id);
      setReceipt(null);
      setHistoryKey((k) => k + 1);
      setToast('Transaksi dihapus.');
    } catch (err) {
      setToast(err.message);
    }
  }

  return (
    <>
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center print:hidden">
          <div className="flex animate-slide-down items-center gap-2 rounded-full bg-slate-800 px-5 py-3 font-semibold text-white shadow-lg">
            <CheckCircle2 className="size-5 text-emerald-400" /> {toast}
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-dvh max-w-md flex-col print:hidden">
        <header className="sticky top-0 z-10 bg-blue-600 px-4 py-3 text-white shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <Fish className="size-6" /> Kalkulator Ikan
            </h1>
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium hover:bg-blue-800"
            >
              <History className="size-4" /> Riwayat
            </button>
          </div>
          {summary.count > 0 && (
            <div className="mt-1 flex justify-between text-sm text-blue-100 tabular-nums">
              <span>
                {summary.count} ember · Netto <b className="text-white">{formatKg(summary.totalNet)}</b>
              </span>
              <b className="text-white">{formatRupiah(Math.max(0, summary.totalAmount))}</b>
            </div>
          )}
        </header>

        <main className="flex-1 space-y-4 p-4 pb-8">
          <section className="card">
            <h2 className="card-title">
              <Truck className="size-4" /> Data Pemasok & Harga
            </h2>
            <div className="space-y-3">
              <SupplierPicker
                suppliers={suppliers}
                loading={suppliersLoading}
                error={suppliersError}
                onRetry={loadSuppliers}
                value={draft.supplierId}
                onChange={(supplierId) => update({ supplierId })}
                onCreated={(s) => {
                  setSuppliers((list) => [...list, s].sort((a, b) => a.name.localeCompare(b.name)));
                  update({ supplierId: s.id });
                }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bucketWeight" className="mb-1 block text-sm font-medium text-slate-700">
                    Berat 1 Ember (Kg)
                  </label>
                  <input
                    id="bucketWeight"
                    value={draft.bucketWeight}
                    onChange={(e) => update({ bucketWeight: e.target.value })}
                    inputMode="decimal"
                    placeholder="Misal: 1,5"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="pricePerKg" className="mb-1 block text-sm font-medium text-slate-700">
                    Harga /Kg (Rp)
                  </label>
                  <input
                    id="pricePerKg"
                    value={draft.pricePerKg}
                    // Hanya angka bulat: "25.000" (format Indonesia) tidak boleh terbaca sebagai 25.
                    onChange={(e) => update({ pricePerKg: e.target.value.replace(/\D/g, '') })}
                    inputMode="numeric"
                    placeholder="Misal: 25000"
                    className="input"
                  />
                  {pricePerKg > 0 && <p className="mt-1 text-xs text-slate-500">{formatRupiah(pricePerKg)}</p>}
                </div>
              </div>
            </div>
          </section>

          <WeighingPanel
            weights={draft.weights}
            onAdd={(w) => setDraft((d) => ({ ...d, weights: [...d.weights, w] }))}
            onRemove={(i) => setDraft((d) => ({ ...d, weights: d.weights.filter((_, j) => j !== i) }))}
          />

          <SummaryCard summary={summary} />

          {saveError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
              {saveError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-4 font-bold text-slate-600 hover:bg-slate-50"
            >
              <Eraser className="size-5" /> Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-md hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
              Simpan Transaksi
            </button>
          </div>
        </main>
      </div>

      <HistorySheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={openTransaction}
        refreshKey={historyKey}
      />

      <Sheet
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={receipt?.fromHistory ? 'Detail Transaksi' : 'Transaksi Tersimpan'}
        icon={CheckCircle2}
        printable
        z="z-50"
        footer={
          <div className="space-y-3">
            {receipt && (
              <a
                href={buildWhatsAppUrl(WHATSAPP_NUMBER, buildReceiptMessage(receipt.trx))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-bold text-white hover:bg-[#1ebe5b]"
              >
                <Send className="size-5" /> Kirim ke WhatsApp
              </a>
            )}
            <div className="flex gap-3">
              {receipt?.fromHistory ? (
                <button
                  onClick={() => deleteTransaction(receipt.trx)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-600 hover:bg-red-100"
                  aria-label="Hapus transaksi"
                >
                  <Trash2 className="size-5" />
                </button>
              ) : null}
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                <Printer className="size-5" /> Cetak
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex flex-[2] items-center justify-center rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
              >
                {receipt?.fromHistory ? 'Tutup' : 'Transaksi Baru'}
              </button>
            </div>
          </div>
        }
      >
        {receipt && <Receipt trx={receipt.trx} />}
      </Sheet>
    </>
  );
}
