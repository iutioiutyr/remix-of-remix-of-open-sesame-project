import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './AdminActivitiesTab.css';

interface ActivityLog {
  docId: string;
  uid: string;
  userName: string;
  userEmail: string;
  action: string;
  contentId: string;
  contentTitle: string;
  contentType: string;
  contentCategory: string;
  episodeNumber: number | null;
  timestamp: any;
  timeStr: string;
}

const PAGE_SIZE = 50;

function formatTime(d: Date): string {
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function actionLabel(a: string) {
  if (a === 'content_opened') return 'Opened';
  if (a === 'stream_started') return 'Streamed';
  if (a === 'episode_selected') return 'Episode';
  return a;
}
function actionCls(a: string) {
  if (a === 'content_opened') return 'badge-open';
  if (a === 'stream_started') return 'badge-stream';
  if (a === 'episode_selected') return 'badge-ep';
  return '';
}
function typeLabel(t: string) {
  if (t === 'MOVIES') return 'Movie';
  if (t === 'TV SERIES') return 'Series';
  if (t === 'ANIMATION') return 'Anime';
  return t || '—';
}
function typeCls(t: string) {
  if (t === 'MOVIES') return 'type-movie';
  if (t === 'TV SERIES') return 'type-series';
  if (t === 'ANIMATION') return 'type-anim';
  return '';
}

export default function AdminActivitiesTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => {
        const data = d.data();
        const ts = data.timestamp?.toDate?.() as Date | undefined;
        return {
          docId: d.id,
          uid: data.uid ?? '',
          userName: data.userName ?? '',
          userEmail: data.userEmail ?? '',
          action: data.action ?? '',
          contentId: data.contentId ?? '',
          contentTitle: data.contentTitle ?? '',
          contentType: data.contentType ?? '',
          contentCategory: data.contentCategory ?? '',
          episodeNumber: data.episodeNumber ?? null,
          timestamp: ts,
          timeStr: ts ? formatTime(ts) : '—',
        };
      }));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = logs;
    const q = search.toLowerCase().trim();
    if (q) list = list.filter((a) =>
      a.userName.toLowerCase().includes(q) ||
      a.userEmail.toLowerCase().includes(q) ||
      a.uid.toLowerCase().includes(q) ||
      a.contentTitle.toLowerCase().includes(q)
    );
    if (actionFilter) list = list.filter((a) => a.action === actionFilter);
    if (typeFilter) list = list.filter((a) => a.contentType === typeFilter);
    return list;
  }, [logs, search, actionFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, actionFilter, typeFilter]);

  const topUsers = useMemo(() => {
    const map = new Map<string, { uid: string; userName: string; userEmail: string; total: number; content_opened: number; stream_started: number; episode_selected: number }>();
    for (const a of logs) {
      if (!map.has(a.uid)) map.set(a.uid, { uid: a.uid, userName: a.userName, userEmail: a.userEmail, total: 0, content_opened: 0, stream_started: 0, episode_selected: 0 });
      const u = map.get(a.uid)!;
      u.total++;
      if (a.action === 'content_opened') u.content_opened++;
      if (a.action === 'stream_started') u.stream_started++;
      if (a.action === 'episode_selected') u.episode_selected++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [logs]);

  async function confirmClear() {
    for (const log of logs) {
      await deleteDoc(doc(db, 'activityLogs', log.docId));
    }
  }

  return (
    <div className="tab-page vjs-AdminActivitiesTab">
      <div className="tab-header">
        <div>
          <h1 className="tab-title">User Activities</h1>
          <p className="tab-sub">{filtered.length} event{filtered.length !== 1 ? 's' : ''} · live feed</p>
        </div>
        <button className="clear-btn" onClick={confirmClear} title="Clear all logs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Clear Logs
        </button>
      </div>

      <div className="act-filters">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user, email or title…" className="search-input" />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="type-sel">
          <option value="">All Actions</option>
          <option value="content_opened">Content Opened</option>
          <option value="stream_started">Stream / Download</option>
          <option value="episode_selected">Episode Selected</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="type-sel">
          <option value="">All Types</option>
          <option value="MOVIES">Movies</option>
          <option value="TV SERIES">TV Series</option>
          <option value="ANIMATION">Animation</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-row">
          <div className="spinner"></div>
          <span>Loading activities…</span>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Email</th>
                <th>UID</th>
                <th>Action</th>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Ep #</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.docId}>
                  <td className="td-date">{a.timeStr}</td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{(a.userName || '?')[0].toUpperCase()}</div>
                      <span className="user-name">{a.userName}</span>
                    </div>
                  </td>
                  <td className="td-email">{a.userEmail}</td>
                  <td className="td-uid" title={a.uid}>{a.uid.slice(0, 8)}…</td>
                  <td><span className={['action-badge', actionCls(a.action)].join(' ').trim()}>{actionLabel(a.action)}</span></td>
                  <td className="td-title">{a.contentTitle || '—'}</td>
                  <td><span className={['type-badge', typeCls(a.contentType)].join(' ').trim()}>{typeLabel(a.contentType)}</span></td>
                  <td className="td-cat">{a.contentCategory || '—'}</td>
                  <td className="td-ep">{a.episodeNumber != null ? a.episodeNumber : '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-row">No activity recorded yet. Activity appears here as users interact with the site.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
        </div>
      )}

      <div className="breakdown-section">
        <h2 className="breakdown-title">Top Active Users</h2>
        <div className="user-cards">
          {topUsers.map((u) => (
            <div key={u.uid} className="user-card">
              <div className="uc-avatar">{(u.userName || '?')[0].toUpperCase()}</div>
              <div className="uc-info">
                <p className="uc-name">{u.userName}</p>
                <p className="uc-email">{u.userEmail}</p>
                <p className="uc-uid">{u.uid}</p>
              </div>
              <div className="uc-stats">
                <div className="uc-count">{u.total}</div>
                <div className="uc-label">actions</div>
                <div className="uc-breakdown">
                  {u.content_opened > 0 && <span className="mini-badge badge-open">{u.content_opened} opened</span>}
                  {u.stream_started > 0 && <span className="mini-badge badge-stream">{u.stream_started} streamed</span>}
                  {u.episode_selected > 0 && <span className="mini-badge badge-ep">{u.episode_selected} ep</span>}
                </div>
              </div>
            </div>
          ))}
          {topUsers.length === 0 && !loading && <div className="empty-row" style={{ textAlign: 'center', padding: '20px' }}>No data yet</div>}
        </div>
      </div>
    </div>
  );
}
