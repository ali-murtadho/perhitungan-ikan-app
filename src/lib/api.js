async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Server error (${res.status}).`);
  return data;
}

export const api = {
  getSuppliers: () => request('/suppliers'),
  createSupplier: (supplier) => request('/suppliers', { method: 'POST', body: supplier }),
  getTransactions: () => request('/transactions'),
  getTransaction: (id) => request(`/transactions/${id}`),
  createTransaction: (trx) => request('/transactions', { method: 'POST', body: trx }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
};
