'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Vendor } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NewPayoutPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ vendor_id: '', amount: '', mode: 'UPI', note: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'OPS') { router.push('/payouts'); return; }
    api.getVendors()
      .then(setVendors)
      .catch(e => setError(e.message))
      .finally(() => setVendorsLoading(false));
  }, [ready, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const p = await api.createPayout({
        vendor_id: Number(form.vendor_id),
        amount: Number(form.amount),
        mode: form.mode,
        note: form.note || undefined,
      });
      router.push(`/payouts/${p.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create payout');
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  const selectedVendor = vendors.find(v => String(v.id) === form.vendor_id);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1">
          ← Back to Payouts
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Payout</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a draft payout request</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            <span>⚠</span><span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendor <span className="text-red-500">*</span></label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              value={form.vendor_id}
              onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))}
              required
              disabled={vendorsLoading}
            >
              <option value="">{vendorsLoading ? 'Loading vendors…' : 'Select a vendor'}</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {selectedVendor?.upi_id && (
              <p className="text-xs text-gray-400 mt-1">UPI: {selectedVendor.upi_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mode <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.mode}
                onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
              >
                {['UPI', 'IMPS', 'NEFT'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3} placeholder="Add a note for this payout…"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-gray-500">Initial status</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Draft
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors" disabled={saving}>
              {saving ? 'Creating…' : 'Create Payout'}
            </button>
            <button type="button" className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
