'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type PayoutListItem, type Vendor } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  Draft:     'bg-gray-100 text-gray-600',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
};
const STATUS_DOT: Record<string, string> = {
  Draft:     'bg-gray-400',
  Submitted: 'bg-yellow-500',
  Approved:  'bg-green-500',
  Rejected:  'bg-red-500',
};

export default function PayoutsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutListItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [vendorId, setVendorId] = useState('');

  const load = useCallback((s: string, v: string) => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (s) params.status = s;
    if (v) params.vendor_id = v;
    api.getPayouts(params)
      .then(setPayouts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    api.getVendors().then(setVendors).catch(() => {});
    load('', '');
  }, [ready, user, router, load]);

  const applyFilters = (e: React.FormEvent) => { e.preventDefault(); load(status, vendorId); };
  const clearFilters = () => { setStatus(''); setVendorId(''); load('', ''); };

  if (!ready) return null;

  const pendingCount = user?.role === 'FINANCE' ? payouts.filter(p => p.status === 'Submitted').length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.role === 'OPS' ? 'Create and manage payout requests' : (
              pendingCount > 0
                ? <span>You have <span className="font-semibold text-yellow-700">{pendingCount} payout{pendingCount !== 1 ? 's' : ''}</span> pending review</span>
                : 'Review and action payout requests'
            )}
          </p>
        </div>
        {user?.role === 'OPS' && (
          <Link href="/payouts/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Payout
          </Link>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <form onSubmit={applyFilters} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {['Draft', 'Submitted', 'Approved', 'Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <button className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors">Apply Filter</button>
          {(status || vendorId) && (
            <button type="button" onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear</button>
          )}
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">All Payouts</h2>
          {!loading && <span className="text-sm text-gray-400">{payouts.length} result{payouts.length !== 1 ? 's' : ''}</span>}
        </div>

        {error && (
          <div className="px-6 py-4">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : payouts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-gray-500 text-sm font-medium">No payouts found</p>
            <p className="text-gray-400 text-xs mt-1">
              {status || vendorId ? 'Try clearing the filters.' : user?.role === 'OPS' ? 'Create your first payout.' : 'No payouts to review yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map(p => {
                  const needsAction = user?.role === 'FINANCE' && p.status === 'Submitted';
                  return (
                    <tr key={p.id} className={`transition-colors ${needsAction ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{p.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{p.vendor?.name}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">{p.mode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        <Link href={`/payouts/${p.id}`} className={`text-xs font-medium hover:underline ${needsAction ? 'text-yellow-700 hover:text-yellow-900' : 'text-blue-600 hover:text-blue-800'}`}>
                          {needsAction ? 'Review →' : 'View →'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
