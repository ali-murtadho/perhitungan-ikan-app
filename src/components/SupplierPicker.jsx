import { useState } from 'react';
import { Loader2, Plus, RefreshCw, UserPlus } from 'lucide-react';
import { api } from '../lib/api.js';

export function SupplierPicker({ suppliers, loading, error, onRetry, value, onChange, onCreated }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setFormError('Nama pemasok wajib diisi.');
    setSaving(true);
    setFormError('');
    try {
      const supplier = await api.createSupplier({ name: name.trim(), phone_number: phone.trim() });
      onCreated(supplier);
      setName('');
      setPhone('');
      setAdding(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        <p>{error}</p>
        <button onClick={onRetry} className="mt-2 flex items-center gap-1 font-semibold underline">
          <RefreshCw className="size-4" /> Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="supplier" className="mb-1 block text-sm font-medium text-slate-700">
        Pemasok / Distributor
      </label>
      <div className="flex gap-2">
        <select
          id="supplier"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="input flex-1"
        >
          <option value="">{loading ? 'Memuat…' : '— Pilih pemasok —'}</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className={`rounded-lg border px-3 transition-colors ${
            adding ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
          aria-label="Tambah pemasok baru"
          title="Tambah pemasok baru"
        >
          <UserPlus className="size-5" />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleCreate} className="mt-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <p className="text-xs font-bold text-blue-700 uppercase">Pemasok baru</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama, misal: Pak Budi (Subang)"
            maxLength={100}
            className="input"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="No. HP (opsional)"
            inputMode="tel"
            maxLength={20}
            className="input"
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Simpan Pemasok
          </button>
        </form>
      )}
    </div>
  );
}
