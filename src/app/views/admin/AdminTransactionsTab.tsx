import { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { isAdmin } from '../../store/auth'
import { useV } from '../../reactive'
import './AdminTransactionsTab.css'

interface Payment {
  id: string
  userId: string
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  amount: number
  planId: string
  planName: string
  orderTrackingId: string
  status: string
  paymentMethod: string
  createdAt: string
}

function normalizeStatus(s?: string): string {
  if (!s) return 'pending'
  const l = s.toLowerCase()
  if (l === 'completed' || l === 'successful' || l === 'success') return 'successful'
  if (l === 'failed' || l === 'fail' || l === 'reversed') return 'failed'
  return 'pending'
}

function fullName(t: Payment): string {
  const fn = t.firstName || ''
  const ln = t.lastName || ''
  return fn || ln ? `${fn} ${ln}`.trim() : ''
}

function fmtDate(d?: string): string {
  if (!d) return 'N/A'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
    dt.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function statusCls(s: string) {
  if (s === 'successful') return 'status-success'
  if (s === 'failed') return 'status-failed'
  return 'status-pending'
}

export default function AdminTransactionsTab() {
  const adminFlag = useV(() => isAdmin.value)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortNewest, setSortNewest] = useState(true)

  const logsDataRef = useRef<any>(null)
  const subsDataRef = useRef<any>(null)
  const gotLogsRef = useRef(false)
  const gotSubsRef = useRef(false)

  useEffect(() => {
    if (!adminFlag) return

    let unsubLogs: (() => void) | null = null
    let unsubSubs: (() => void) | null = null

    function buildPayments() {
      if (!gotLogsRef.current || !gotSubsRef.current) return
      const map: Record<string, Payment> = {}

      const logsData = logsDataRef.current
      const subsData = subsDataRef.current

      if (logsData && typeof logsData === 'object') {
        for (const [key, v] of Object.entries(logsData as Record<string, any>)) {
          map[key] = {
            id: key,
            userId: v.userId || '',
            email: v.email || '',
            phoneNumber: v.phoneNumber || v.phone_number || v.phone || v.payment_account || '',
            firstName: v.firstName || v.first_name || v.userName || v.displayName || '',
            lastName: v.lastName || v.last_name || '',
            amount: Number(v.amount) || 0,
            planId: v.planId || '',
            planName: v.planName || v.plan || '',
            orderTrackingId: v.orderTrackingId || key,
            status: normalizeStatus(v.status),
            paymentMethod: v.paymentMethod || v.payment_method || v.method || '',
            createdAt: v.createdAt || v.created_at || '',
          }
        }
      }

      if (subsData && typeof subsData === 'object') {
        for (const [userId, v] of Object.entries(subsData as Record<string, any>)) {
          const trackingId = v.orderTrackingId || `sub-${userId}`
          if (!map[trackingId]) {
            map[trackingId] = {
              id: trackingId,
              userId,
              email: v.email || '',
              phoneNumber: v.paymentPhone || v.phoneNumber || v.phone || '',
              firstName: v.firstName || v.displayName || v.planName || '',
              lastName: v.lastName || '',
              amount: Number(v.amount) || 0,
              planId: v.planId || '',
              planName: v.planName || v.planId || '',
              orderTrackingId: trackingId,
              status: 'successful',
              paymentMethod: v.paymentMethod || 'Admin Activation',
              createdAt: v.createdAt || v.startDate || '',
            }
          }
        }
      }

      setPayments(Object.values(map))
      setLoading(false)
    }

    setLoading(true)
    gotLogsRef.current = false
    gotSubsRef.current = false
    logsDataRef.current = null
    subsDataRef.current = null

    unsubLogs = onSnapshot(collection(db, 'paymentLogs'), (snap) => {
      const d: any = {}
      snap.forEach(doc_ => { d[doc_.id] = doc_.data() })
      logsDataRef.current = d
      gotLogsRef.current = true
      buildPayments()
    }, () => { gotLogsRef.current = true; buildPayments() })

    unsubSubs = onSnapshot(collection(db, 'subscriptions'), (snap) => {
      const d: any = {}
      snap.forEach(doc_ => { d[doc_.id] = doc_.data() })
      subsDataRef.current = d
      gotSubsRef.current = true
      buildPayments()
    }, () => { gotSubsRef.current = true; buildPayments() })

    return () => {
      if (unsubLogs) unsubLogs()
      if (unsubSubs) unsubSubs()
    }
  }, [adminFlag])

  const successCount = payments.filter(p => p.status === 'successful').length
  const failedCount = payments.filter(p => p.status === 'failed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

  let filteredPayments = [...payments]
  if (statusFilter) filteredPayments = filteredPayments.filter(p => p.status === statusFilter)
  if (search) {
    const q = search.toLowerCase()
    filteredPayments = filteredPayments.filter(p =>
      p.phoneNumber?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.orderTrackingId?.toLowerCase().includes(q)
    )
  }
  filteredPayments.sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0
    if (da === 0 && db2 === 0) return 0
    if (da === 0) return 1
    if (db2 === 0) return -1
    return sortNewest ? db2 - da : da - db2
  })

  async function deletePayment(t: Payment) {
    try {
      if (t.id.startsWith('sub-')) {
        await deleteDoc(doc(db, 'subscriptions', t.userId))
      } else {
        await deleteDoc(doc(db, 'paymentLogs', t.id))
      }
    } catch {
      alert('Failed to delete transaction')
    }
  }

  return (
    <div className="tab-page vjs-AdminTransactionsTab">
      <div className="tab-header">
        <h1 className="tab-title">Transactions</h1>
        <p className="tab-sub">All payment transactions with real-time updates</p>
      </div>

      <div className="summary-grid">
        <div className="sum-card sum-success">
          <div className="sum-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4db8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg></div>
          <div className="sum-val">{successCount}</div>
          <div className="sum-label">Successful</div>
        </div>
        <div className="sum-card sum-failed">
          <div className="sum-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div className="sum-val">{failedCount}</div>
          <div className="sum-label">Failed</div>
        </div>
        <div className="sum-card sum-pending">
          <div className="sum-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div className="sum-val">{pendingCount}</div>
          <div className="sum-label">Pending</div>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-wrap">
          <svg className="search-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by phone, email, or name…" className="search-input" />
        </div>
        <div className="filter-controls">
          <div className="select-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-sel">
              <option value="">All Status</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <svg className="sel-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button className="sort-btn" onClick={() => setSortNewest(v => !v)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            {sortNewest ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spin-ring"></div>
          <p className="loading-text">Loading transactions…</p>
        </div>
      ) : (
        <div className="table-wrap desktop-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>CONTACT</th>
                <th>PLAN</th>
                <th>AMOUNT</th>
                <th>METHOD</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="user-cell">
                      <div className="u-avatar">{(t.firstName || t.email || '?')[0].toUpperCase()}</div>
                      <div className="u-info">
                        <span className="u-name">{fullName(t) || '—'}</span>
                        <span className="u-id">{t.userId}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      {t.phoneNumber && (
                        <span className="contact-phone">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.007 1.16A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.36 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                          {t.phoneNumber}
                        </span>
                      )}
                      {t.email && (
                        <span className="contact-email">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {t.email.length > 22 ? t.email.slice(0, 22) + '…' : t.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="plan-cell">{t.planName || t.planId || '—'}</td>
                  <td className="amount-cell">{t.amount > 0 ? 'UGX ' + Number(t.amount).toLocaleString() : '—'}</td>
                  <td className="method-cell">{t.paymentMethod || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${statusCls(t.status)}`}>
                      <span className="status-dot"></span>
                      {capitalize(t.status)}
                    </span>
                  </td>
                  <td className="date-cell">{fmtDate(t.createdAt)}</td>
                  <td>
                    <button className="del-btn" onClick={() => deletePayment(t)} title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="empty-row">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="mobile-cards">
          {filteredPayments.length === 0 && <div className="empty-row">No transactions found.</div>}
          {filteredPayments.map(t => (
            <div key={t.id} className="txn-card">
              <div className="txn-card-top">
                <div className="txn-user">
                  <div className="u-avatar">{(t.firstName || t.email || '?')[0].toUpperCase()}</div>
                  <div className="txn-user-info">
                    <span className="u-name">{fullName(t) || t.email?.split('@')[0] || '—'}</span>
                    <span className="txn-contact">{t.phoneNumber || t.email || '—'}</span>
                  </div>
                </div>
                <span className={`status-badge ${statusCls(t.status)}`}>
                  <span className="status-dot"></span>{capitalize(t.status)}
                </span>
              </div>
              <div className="txn-card-mid">
                <div className="txn-detail">
                  <span className="txn-detail-label">Plan</span>
                  <span className="txn-detail-val">{t.planName || t.planId || '—'}</span>
                </div>
                <div className="txn-detail">
                  <span className="txn-detail-label">Amount</span>
                  <span className="txn-detail-val txn-amount">{t.amount > 0 ? 'UGX ' + Number(t.amount).toLocaleString() : '—'}</span>
                </div>
                <div className="txn-detail">
                  <span className="txn-detail-label">Method</span>
                  <span className="txn-detail-val">{t.paymentMethod || 'N/A'}</span>
                </div>
                <div className="txn-detail">
                  <span className="txn-detail-label">Date</span>
                  <span className="txn-detail-val">{fmtDate(t.createdAt)}</span>
                </div>
              </div>
              <div className="txn-card-bot">
                <button className="del-btn" onClick={() => deletePayment(t)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
