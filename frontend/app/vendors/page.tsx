'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Vendor } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function VendorsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', upi_id: '', bank_account: '', ifsc: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    api.getVendors()
      .then(setVendors)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, user, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    setSaving(true);
    try {
      const v = await api.createVendor(form);
      setVendors(prev => [v, ...prev]);
      setForm({ name: '', upi_id: '', bank_account: '', ifsc: '' });
      setSuccess(`Vendor "${v.name}" added successfully.`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to add vendor');
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage payment recipients</p>
        </div>
        <span className="text-sm text-gray-400">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Add New Vendor</h2>
        {formError && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            <span>⚠</span><span>{formError}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            <span>✓</span><span>{success}</span>
          </div>
        )}
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name <span className="text-red-500">*</span></label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Acme Corp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. vendor@upi" value={form.upi_id} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Account number" value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. HDFC0001234" value={form.ifsc} onChange={e => setForm(f => ({ ...f, ifsc: e.target.value }))} />
            </div>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors" disabled={saving}>
            {saving ? 'Adding…' : '+ Add Vendor'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">All Vendors</h2>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading vendors…</div>
        ) : error ? (
          <div className="px-6 py-6"><div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div></div>
        ) : vendors.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-500 text-sm font-medium">No vendors yet</p>
            <p className="text-gray-400 text-xs mt-1">Add your first vendor using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UPI ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Account</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IFSC</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{v.upi_id || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{v.bank_account || <span className="text-gray-300 font-sans">—</span>}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{v.ifsc || <span className="text-gray-300 font-sans">—</span>}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${v.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
