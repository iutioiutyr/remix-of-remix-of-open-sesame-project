import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isAdmin } from '../../store/auth';
import { dbSubscriptionPlans } from '../../store/db';
import { useV } from '../../reactive';
import './AdminUsersTab.css';

interface Subscription {
  planId: string;
  planName?: string;
  startDate: string;
  endDate: string;
  active: boolean;
}
interface UserItem {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLogin?: string;
  subscription?: Subscription;
}

const FALLBACK_PLANS = [
  { key: 'fb-1d', durationDays: 1, name: '1 Day Pass', price: 0 },
  { key: 'fb-2d', durationDays: 2, name: '2 Days Pass', price: 0 },
  { key: 'fb-1w', durationDays: 7, name: '1 Week Pass', price: 0 },
  { key: 'fb-2w', durationDays: 14, name: '2 Weeks Pass', price: 0 },
  { key: 'fb-1m', durationDays: 30, name: '1 Month Pass', price: 0 },
];

const PLAN_COLORS = ['#2b7fe0', '#2563eb', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#0d9488', '#9333ea'];
function planColor(idx: number) {
  return PLAN_COLORS[idx % PLAN_COLORS.length];
}

function isSubActive(sub?: Subscription): boolean {
  if (!sub?.active) return false;
  if (!sub.endDate) return false;
  return new Date(sub.endDate) > new Date();
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcRemaining(endDate: string): string {
  if (!endDate) return '—';
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export default function AdminUsersTab() {
  const adminFlag = useV(() => isAdmin.value);
  const dbPlans = useV(() => dbSubscriptionPlans.value);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PLANS = dbPlans.length > 0 ? dbPlans : FALLBACK_PLANS;

  const activeCount = useMemo(() => users.filter((u) => isSubActive(u.subscription)).length, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? users.filter(
          (u) =>
            (u.displayName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        )
      : [...users];
    return list.sort((a, b) => {
      const aActive = isSubActive(a.subscription);
      const bActive = isSubActive(b.subscription);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.lastLogin || b.createdAt || 0).getTime() - new Date(a.lastLogin || a.createdAt || 0).getTime();
    });
  }, [users, search]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function loadUsers() {
    if (!isAdmin.value) return;
    setLoading(true);
    setError('');
    try {
      const [usersSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'subscriptions')),
      ]);

      if (usersSnap.empty) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const subsData: Record<string, Subscription> = {};
      subsSnap.forEach((d) => {
        subsData[d.id] = d.data() as Subscription;
      });

      const list: UserItem[] = usersSnap.docs.map((docSnap) => {
        const v = docSnap.data();
        const id = docSnap.id;
        return {
          id,
          email: v.email || v.Email || '',
          displayName: v.displayName || v.name || v.email?.split('@')[0] || 'User',
          createdAt: v.createdAt || v.joinedAt || '',
          lastLogin: v.lastLogin,
          subscription: subsData[id] || undefined,
        };
      });

      setUsers(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users. Check Firebase rules.');
    }
    setLoading(false);
  }

  async function handleActivate(uid: string, planId: string, days: number, planName: string) {
    setActionLoading(uid);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + days * 86400000);
      const sub: Subscription = {
        planId,
        planName,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        active: true,
      };
      await setDoc(doc(db, 'subscriptions', uid), sub);
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, subscription: sub } : u)));
      showToast(`✓ Activated ${planName} for user`);
    } catch (e: any) {
      showToast(`Error: ${e?.message || 'Failed'}`);
    }
    setActionLoading(null);
  }

  async function handleDeactivate(uid: string) {
    setActionLoading(uid);
    try {
      await deleteDoc(doc(db, 'subscriptions', uid));
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, subscription: undefined } : u)));
      showToast('Subscription deactivated');
    } catch (e: any) {
      showToast(`Error: ${e?.message || 'Failed'}`);
    }
    setActionLoading(null);
  }

  // Load when admin is confirmed
  useEffect(() => {
    if (adminFlag) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminFlag]);

  return (
    <div className="tab-page vjs-AdminUsersTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Users</h1>
        <div className="header-stats">
          <span className="hstat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Total: {users.length}
          </span>
          <span className="hstat green">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b9cff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
            Active: {activeCount}
          </span>
          <button className="refresh-btn" onClick={loadUsers} disabled={loading}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={loading ? { animation: 'spin 0.8s linear infinite' } : undefined}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="search-row">
        <div className="search-wrap">
          <svg className="search-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spin-ring"></div>
          <p className="loading-text">Loading users…</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button className="refresh-btn mt-4" onClick={loadUsers}>Retry</button>
        </div>
      ) : (
        <div className="users-list">
          {filteredUsers.map((u) => (
            <div key={u.id} className="user-card">
              <div className="user-top">
                <div className="user-left">
                  <div className="user-avatar">{(u.displayName || u.email || '?')[0].toUpperCase()}</div>
                  <div className="user-info">
                    <p className="user-name">{u.displayName || u.email?.split('@')[0] || '—'}</p>
                    <p className="user-email">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {u.email}
                    </p>
                  </div>
                </div>
                <div className="user-actions">
                  {isSubActive(u.subscription) ? (
                    <span className="badge-active">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Active
                    </span>
                  ) : (
                    <span className="badge-none">No Sub</span>
                  )}

                  {isSubActive(u.subscription) && (
                    <button
                      className="btn-deactivate"
                      disabled={actionLoading === u.id}
                      onClick={() => handleDeactivate(u.id)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              <div className="user-meta">
                <div className="meta-col">
                  <span className="meta-label">Joined</span>
                  <span className="meta-val">{fmtDate(u.createdAt)}</span>
                </div>
                <div className="meta-col">
                  <span className="meta-label">Last Login</span>
                  <span className="meta-val">{u.lastLogin ? fmtDate(u.lastLogin) : 'Never'}</span>
                </div>
              </div>

              {isSubActive(u.subscription) ? (
                <div className="sub-box">
                  <div className="sub-header-row">SUBSCRIPTION</div>
                  <div className="sub-details">
                    <div className="sub-col">
                      <span className="sub-label">Plan</span>
                      <span className="sub-val">{u.subscription?.planName || u.subscription?.planId}</span>
                    </div>
                    <div className="sub-col">
                      <span className="sub-label">Start</span>
                      <span className="sub-val">{fmtDate(u.subscription?.startDate)}</span>
                    </div>
                    <div className="sub-col">
                      <span className="sub-label">Expires</span>
                      <span className="sub-val">{fmtDate(u.subscription?.endDate)}</span>
                    </div>
                    <div className="sub-col">
                      <span className="sub-label">Remaining</span>
                      <span className="sub-val">{calcRemaining(u.subscription?.endDate || '')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sub-btns">
                  {PLANS.length === 0 && (
                    <div className="no-plans-note">
                      No subscription plans set up yet. Add plans in the Plans tab.
                    </div>
                  )}
                  {PLANS.map((plan, idx) => (
                    <button
                      key={plan.key}
                      className="sub-btn"
                      style={{ background: planColor(idx), borderColor: planColor(idx) }}
                      disabled={!!actionLoading}
                      onClick={() => handleActivate(u.id, plan.key, plan.durationDays, plan.name)}
                    >
                      <span className="sub-btn-name">{plan.name}</span>
                      {plan.price > 0 && <span className="sub-btn-price">UGX {plan.price.toLocaleString()}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <div className="empty">
              {users.length === 0 ? 'No users registered yet.' : 'No users match your search.'}
            </div>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
