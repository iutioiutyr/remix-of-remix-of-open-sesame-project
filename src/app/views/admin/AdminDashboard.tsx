import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { isAdmin, authLoading } from '../../store/auth';
import { dbMovies, dbSeries, dbAnimation, dbCarousel } from '../../store/db';
import { useV } from '../../reactive';
import { useNavigate } from '@tanstack/react-router';
import AdminUsersTab from './AdminUsersTab';
import AdminCarouselTab from './AdminCarouselTab';
import AdminMoviesTab from './AdminMoviesTab';
import AdminSeriesTab from './AdminSeriesTab';
import AdminAnimationTab from './AdminAnimationTab';
import AdminTransactionsTab from './AdminTransactionsTab';
import AdminSubscriptionPlansTab from './AdminSubscriptionPlansTab';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminFlag = useV(() => isAdmin.value);
  const loading = useV(() => authLoading.value);

  const [activeTab, setActiveTab] = useState('overview');
  const [userCount, setUserCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);

  const movies = useV(() => dbMovies.value);
  const series = useV(() => dbSeries.value);
  const animation = useV(() => dbAnimation.value);
  const carousel = useV(() => dbCarousel.value);

  useEffect(() => {
    if (!loading && !adminFlag) {
      navigate({ to: '/' });
    }
  }, [loading, adminFlag, navigate]);

  async function loadOverviewCounts() {
    if (!isAdmin.value) return;
    try {
      const [usersSnap, logsSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'paymentLogs')),
        getDocs(collection(db, 'subscriptions')),
      ]);
      setUserCount(usersSnap.size);
      const logsKeys = new Set(logsSnap.docs.map((d) => d.id));
      let subsExtra = 0;
      for (const docSnap of subsSnap.docs) {
        const v = docSnap.data();
        const tid = v.orderTrackingId || `sub-${docSnap.id}`;
        if (!logsKeys.has(tid)) subsExtra++;
      }
      setPaymentCount(logsKeys.size + subsExtra);
    } catch (_) {}
  }

  useEffect(() => {
    if (adminFlag) loadOverviewCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminFlag]);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
    { id: 'users', label: 'Users', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
    { id: 'carousel', label: 'Carousel', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="22" height="13" rx="2"/><path d="M1 10h22"/></svg>' },
    { id: 'movies', label: 'Movies', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>' },
    { id: 'series', label: 'Series', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 2H8l-2 5h12z"/></svg>' },
    { id: 'animation', label: 'Animation', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M9.5 8.5L16 12l-6.5 3.5V8.5z" fill="currentColor"/></svg>' },
    { id: 'wallet', label: 'Wallet', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>' },
    { id: 'plans', label: 'Plans', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  ];

  const mobNavItems = [
    { id: 'overview', label: 'Home', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
    { id: 'movies', label: 'Movies', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>' },
    { id: 'series', label: 'Series', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 2H8l-2 5h12z"/></svg>' },
    { id: 'animation', label: 'Anime', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.5 8.5L16 12l-6.5 3.5V8.5z" fill="currentColor"/></svg>' },
    { id: 'carousel', label: 'Carousel', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="22" height="13" rx="2"/><path d="M1 10h22"/></svg>' },
    { id: 'wallet', label: 'Wallet', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>' },
    { id: 'users', label: 'Users', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { id: 'plans', label: 'Plans', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  ];

  const statCards = [
    { label: 'Total Users', val: userCount, tab: 'users', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4dd0ff" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
    { label: 'Total Movies', val: movies.length, tab: 'movies', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>' },
    { label: 'Total Series', val: series.length, tab: 'series', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 2H8l-2 5h12z"/></svg>' },
    { label: 'Animation', val: animation.length, tab: 'animation', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="rgba(167,139,250,0.3)"/></svg>' },
    { label: 'Carousel Items', val: carousel.length, tab: 'carousel', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><rect x="1" y="6" width="22" height="13" rx="2"/><path d="M1 10h22"/></svg>' },
    { label: 'Payments', val: paymentCount, tab: 'wallet', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>' },
  ];

  const quickActions = [
    { label: 'Manage Movies', desc: 'Add, edit, or delete movies', tab: 'movies', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg>' },
    { label: 'Manage Series', desc: 'Add series with episodes', tab: 'series', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 2H8l-2 5h12z"/></svg>' },
    { label: 'Animation', desc: 'Upload animated content', tab: 'animation', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="rgba(167,139,250,0.3)"/></svg>' },
    { label: 'Manage Carousel', desc: 'Update featured banners', tab: 'carousel', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><rect x="1" y="6" width="22" height="13" rx="2"/><path d="M1 10h22"/></svg>' },
    { label: 'Manage Users', desc: 'View & activate subscriptions', tab: 'users', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4dd0ff" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
    { label: 'Payment Wallet', desc: 'View payment history', tab: 'wallet', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>' },
    { label: 'Subscription Plans', desc: 'Add, edit or remove plans', tab: 'plans', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d9a3" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  ];

  return (
    <div className="admin-wrap vjs-AdminDashboard">
      <nav className="admin-topnav">
        <a href="/" className="topnav-back" title="Back to website">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span className="topnav-label">Site</span>
        </a>
        <div className="topnav-divider"></div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={['topnav-item', activeTab === item.id ? 'active' : ''].join(' ').trim()}
          >
            <span className="topnav-icon" dangerouslySetInnerHTML={{ __html: item.icon }}></span>
            <span className="topnav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-mobile-topbar">
        <a href="/" className="mob-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </a>
        <span className="mob-topbar-title">Admin</span>
        <img src="/logo.png" alt="" className="mob-topbar-logo" />
      </div>

      <main className="admin-content">
        {activeTab === 'overview' ? (
          <div className="tab-page">
            <div className="ov-header">
              <h1 className="ov-title">Admin Dashboard</h1>
              <p className="ov-sub">Welcome back, wanifred03@gmail.com</p>
            </div>

            <div className="stat-grid">
              {statCards.map((c) => (
                <div className="stat-card" key={c.label} onClick={() => setActiveTab(c.tab)}>
                  <div className="stat-icon" dangerouslySetInnerHTML={{ __html: c.icon }}></div>
                  <div className="stat-val">{c.val}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="qa-section">
              <h2 className="qa-title">Quick Actions</h2>
              <div className="qa-grid">
                {quickActions.map((a) => (
                  <button key={a.tab} className="qa-btn" onClick={() => setActiveTab(a.tab)}>
                    <span className="qa-icon" dangerouslySetInnerHTML={{ __html: a.icon }}></span>
                    <div className="qa-text">
                      <span className="qa-name">{a.label}</span>
                      <span className="qa-desc">{a.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'users' ? (
          <AdminUsersTab />
        ) : activeTab === 'carousel' ? (
          <AdminCarouselTab />
        ) : activeTab === 'movies' ? (
          <AdminMoviesTab />
        ) : activeTab === 'series' ? (
          <AdminSeriesTab />
        ) : activeTab === 'animation' ? (
          <AdminAnimationTab />
        ) : activeTab === 'wallet' ? (
          <AdminTransactionsTab />
        ) : activeTab === 'plans' ? (
          <AdminSubscriptionPlansTab />
        ) : null}
      </main>

      <nav className="admin-mob-nav">
        {mobNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={['amob-item', activeTab === item.id ? 'active' : ''].join(' ').trim()}
          >
            <span className="amob-icon" dangerouslySetInnerHTML={{ __html: item.icon }}></span>
            <span className="amob-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
