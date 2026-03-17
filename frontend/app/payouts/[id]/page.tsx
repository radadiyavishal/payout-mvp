'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, type PayoutDetail } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  Draft:     'bg-gray-100 text-gray-600',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
};
const STATUS_DOT: Record<string, string> = {
  Draft: 'bg-gray-400', Submitted: 'bg-yellow-500', Approved: 'bg-green-500', Rejected: 'bg-red-500',
};
const ACTION_DOT: Record<string, string> = {
  CREATED: 'bg-blue-500', SUBMITTED: 'bg-yellow-500', APPROVED: 'bg-green-500', REJECTED: 'bg-red-500',
};
const ACTION_LABEL: Record<string, string> = {
  CREATED: 'Payout created', SUBMITTED: 'Submitted for approval', APPROVED: 'Approved', REJECTED: 'Rejected',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export default function PayoutDetailPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [payout, setPayout] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api.getPayout(id)
      .then(data => setPayout(data as PayoutDetail))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user, router, load]);

  const doAction = async (fn: () => Promise<unknown>) => {
    setActionError('');
    setActing(true);
    try {
      await fn();
      await load();
      setShowReject(false);
      setRejectReason('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      </div>
    );
  }

  if (!payout) return null;

  const canSubmit  = user?.role === 'OPS'     && payout.status === 'Draft';
  const canApprove = user?.role === 'FINANCE' && payout.status === 'Submitted';
  const canReject  = user?.role === 'FINANCE' && payout.status === 'Submitted';
  const hasActions = canSubmit || canApprove || canReject;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <button onClick={() => router.push('/payouts')} className="text-xs text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1 transition-colors">
          ← Back to Payouts
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payout #{payout.id}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{payout.vendor?.name}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 ${STATUS_STYLES[payout.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[payout.status]}`} />
            {payout.status}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Payout Details</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="Amount" value={<span className="text-xl font-bold text-gray-900">₹{Number(payout.amount).toLocaleString('en-IN')}</span>} />
          <Field label="Mode" value={<span className="inline-block bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-semibold">{payout.mode}</span>} />
          <Field label="Vendor" value={payout.vendor?.name} />
          <Field label="Created" value={new Date(payout.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          {payout.vendor?.upi_id && <Field label="UPI ID" value={payout.vendor.upi_id} />}
          {payout.vendor?.bank_account && (
            <Field label="Bank Account" value={`${payout.vendor.bank_account}${payout.vendor.ifsc ? ` · ${payout.vendor.ifsc}` : ''}`} />
          )}
          {payout.note && (
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Note</p>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{payout.note}</p>
            </div>
          )}
        </div>

        {payout.status === 'Rejected' && payout.decision_reason && (
          <div className="mx-6 mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Rejection Reason</p>
            <p className="text-sm text-red-800">{payout.decision_reason}</p>
          </div>
        )}

        {hasActions && (
          <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            {actionError && (
              <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <span>⚠</span><span>{actionError}</span>
              </div>
            )}
            {canSubmit && (
              <div className="flex items-center gap-3">
                <button onClick={() => doAction(() => api.submitPayout(id))} disabled={acting}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {acting ? 'Submitting…' : 'Submit for Approval'}
                </button>
                <p className="text-xs text-gray-400">Moves payout to <strong>Submitted</strong> status.</p>
              </div>
            )}
            {(canApprove || canReject) && !showReject && (
              <div className="flex items-center gap-3">
                {canApprove && (
                  <button onClick={() => doAction(() => api.approvePayout(id))} disabled={acting}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                    {acting ? 'Approving…' : '✓ Approve'}
                  </button>
                )}
                {canReject && (
                  <button onClick={() => setShowReject(true)} disabled={acting}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-300 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                    ✕ Reject
                  </button>
                )}
              </div>
            )}
            {showReject && (
              <div className="bg-white border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Rejection reason <span className="text-red-500">*</span></p>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  rows={3} placeholder="Explain why this payout is being rejected…"
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => doAction(() => api.rejectPayout(id, rejectReason))}
                    disabled={acting || !rejectReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                    {acting ? 'Rejecting…' : 'Confirm Rejection'}
                  </button>
                  <button onClick={() => { setShowReject(false); setRejectReason(''); }} disabled={acting}
                    className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasActions && (payout.status === 'Approved' || payout.status === 'Rejected') && (
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
            <p className="text-xs text-gray-400">
              This payout has been <strong>{payout.status.toLowerCase()}</strong> and no further actions are available.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Audit Trail</h2>
          <p className="text-xs text-gray-400 mt-0.5">Full history of actions on this payout</p>
        </div>
        {payout.audits.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">No audit entries yet.</div>
        ) : (
          <div className="px-6 py-5">
            <ol className="relative border-l-2 border-gray-100 space-y-6 ml-2">
              {payout.audits.map((a, idx) => (
                <li key={a.id} className="ml-5 relative">
                  <div className={`absolute -left-[1.65rem] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${ACTION_DOT[a.action]}`} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{ACTION_LABEL[a.action]}</span>
                        {idx === payout.audits.length - 1 && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Latest</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        by <span className="font-medium text-gray-700">{a.user?.email}</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold ${a.user?.role === 'OPS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {a.user?.role}
                        </span>
                      </p>
                    </div>
                    <time className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                      {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
