import { useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../store/auth'
import { loginOpen, subscribeOpen, subscribeMovie } from '../store/ui'
import { usePWAInstall } from '../composables/usePWAInstall'
import { theme, toggleTheme } from '../store/theme'
import { useV } from '../reactive'
import './AppHeader.css'
import brandLogo from '../../assets/luo-niger-movies-logo.png'

export default function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { currentUser, isLoggedIn, isAdmin, logOut } = useAuth()
  const currentUserV = useV(() => currentUser.value)
  const isLoggedInV = useV(() => isLoggedIn.value)
  const isAdminV = useV(() => isAdmin.value)
  const themeV = useV(() => theme.value)
  const { isInstallable, promptInstall } = usePWAInstall()
  const isInstallableV = useV(() => isInstallable.value)

  const userInitial = (() => {
    const name = currentUserV?.displayName || currentUserV?.email || '?'
    return (name[0] ?? '?').toUpperCase()
  })()

  const userName = (() => {
    const name = currentUserV?.displayName || currentUserV?.email || ''
    return name.length > 14 ? name.slice(0, 12) + '…' : name
  })()

  async function handleLogout() {
    await logOut()
  }

  const navItems = [
    { label: 'HOME', path: '/' },
    { label: 'MOVIES', path: '/movies' },
    { label: 'MUSIC', path: '/music' },
    ...(isAdminV ? [{ label: 'ADMIN', path: '/admin' }] : []),
  ]

  function handleSubscribeClick() {
    if (!isLoggedInV) {
      loginOpen.value = true
    } else {
      subscribeMovie.value = null
      subscribeOpen.value = true
    }
  }

  function doSearch() {
    if (searchQuery.trim()) {
      navigate({ to: '/', search: { q: searchQuery.trim() } as any })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 vjs-AppHeader">
        <div className="header-bar">
          <div className="header-inner">

            {/* Brand */}
            <Link to="/" className="brand-link">
              <img src={brandLogo} alt="LUO NIGER MOVIES" width={1496} height={390} className="brand-logo" />
            </Link>

            {/* Desktop nav */}
            <nav className="nav-pill hidden items-center lg:flex">
              {navItems.filter((item) => item.label !== 'ADMIN').map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'nav-item--active' : ''} ${item.label === 'ADMIN' ? 'nav-item--admin' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search bar — visible on desktop always, on mobile shown inline */}
            <form
              className="header-search"
              onSubmit={(e) => { e.preventDefault(); doSearch() }}
            >
              <svg className="hs-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search movies..."
                className="hs-input"
                onKeyUp={(e) => { if (e.key === 'Enter') doSearch() }}
              />
              <button type="submit" className="hs-btn">GO</button>
            </form>

            {/* Right actions */}
            <div className="right-actions">

              {/* Install App */}
              {isInstallableV && (
                <button className="btn-install" onClick={promptInstall} title="Install App">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="install-label">INSTALL</span>
                </button>
              )}

              {/* Theme toggle */}
              <button className="btn-theme" onClick={toggleTheme} title={themeV === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {themeV === 'dark' ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <button className="btn-subscribe" onClick={handleSubscribeClick}>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 17v2M13 11v2" /></svg>
                <span className="sub-label">GET ACCESS</span>
              </button>

              <div className="h-4 w-px bg-white/15"></div>

              {/* Logged in */}
              {isLoggedInV ? (
                <div className="user-menu">
                  <div className="user-avatar-wrap">
                    <div className="user-avatar">{userInitial}</div>
                    <span className="hidden sm:inline user-name-short">{userName}</span>
                  </div>
                  <button className="btn-logout" onClick={handleLogout} title="Sign out">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    <span className="logout-label">LOGOUT</span>
                  </button>
                </div>
              ) : (
                <button className="btn-login" onClick={() => { loginOpen.value = true }}>
                  <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="login-label">LOGIN</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Bottom mobile navigation bar */}
      <nav className="mobile-bottom-nav vjs-AppHeader">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mob-nav-item ${location.pathname === item.path ? 'mob-nav-item--active' : ''} ${item.label === 'ADMIN' ? 'mob-nav-item--admin' : ''}`}
          >
            {/* Home icon */}
            {item.label === 'HOME' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
            {/* Movies icon */}
            {item.label === 'MOVIES' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            )}
            {/* Series icon */}
            {item.label === 'SERIES' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {/* Animation icon */}
            {item.label === 'ANIMATION' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {item.label === 'MUSIC' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {/* Admin icon */}
            {item.label === 'ADMIN' && (
              <svg className="mob-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="mob-nav-label">{item.label === 'ANIMATION' ? 'ANIME' : item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
