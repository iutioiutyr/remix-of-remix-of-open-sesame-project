import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Movie } from '../data/movies'
import { useAuth } from '../store/auth'
import { isSubscribed, hasMovieAccess, userSubscription } from '../store/subscription'
import { loginOpen, subscribeOpen, subscribeMovie } from '../store/ui'
import { toDirectDownload } from '../lib/utils'
import { logActivity } from '../lib/logActivity'
import { useV } from '../reactive'
import './DownloadModal.css'

export interface DownloadModalProps {
  movie: Movie | null
  onClose: () => void
}

const isIOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
)

export default function DownloadModal({ movie, onClose }: DownloadModalProps) {
  const { isLoggedIn } = useAuth()
  const loggedIn = useV(() => isLoggedIn.value)
  useV(() => isSubscribed.value)
  useV(() => userSubscription.value)
  const subscribed = hasMovieAccess(movie ? String(movie.id) : undefined)

  function openLogin() { loginOpen.value = true }
  function openSubscribe() { subscribeMovie.value = movie ? { id: String(movie.id), title: movie.title } : null; subscribeOpen.value = true }

  const [selectedEpNum, setSelectedEpNum] = useState<number | null>(null)

  function selectEpisode(epNum: number) {
    setSelectedEpNum(epNum)
    if (movie) {
      logActivity({
        action: 'episode_selected',
        contentId: movie.id,
        contentTitle: movie.title,
        contentType: movie.type,
        contentCategory: movie.category,
        episodeNumber: epNum,
      })
    }
  }

  useEffect(() => {
    setSelectedEpNum(null)
    if (movie) {
      logActivity({
        action: 'content_opened',
        contentId: movie.id,
        contentTitle: movie.title,
        contentType: movie.type,
        contentCategory: movie.category,
      })
    }
  }, [movie])

  const selectedEpisode = (!movie?.episodes || selectedEpNum === null)
    ? null
    : movie.episodes.find(ep => ep.episodeNumber === selectedEpNum) ?? null

  const posterThumbStyle = movie
    ? { background: `linear-gradient(160deg, ${movie.color || '#0d2035'} 0%, #05070d 100%)` }
    : {}

  // ── Embedded viewer ────────────────────────────────────────────
  const [showViewer, setShowViewer] = useState(false)
  const [viewerUrl, setViewerUrl] = useState('')
  const [viewerTitle, setViewerTitle] = useState('')
  const [iframeLoading, setIframeLoading] = useState(false)
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openViewer(rawUrl: string, title: string) {
    logActivity({
      action: 'stream_started',
      contentId: movie?.id,
      contentTitle: title,
      contentType: movie?.type,
      contentCategory: movie?.category,
      episodeNumber: selectedEpNum ?? undefined,
    })
    const url = toDirectDownload(rawUrl)
    if (isIOS) {
      window.open(url, '_blank', 'noopener')
      return
    }
    setViewerUrl(url)
    setViewerTitle(title)
    setIframeLoading(true)
    setShowViewer(true)
    if (loadTimer.current) clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => { setIframeLoading(false) }, 8000)
  }

  function onIframeLoad() {
    if (loadTimer.current) { clearTimeout(loadTimer.current); loadTimer.current = null }
    setIframeLoading(false)
  }

  function closeViewer() {
    setShowViewer(false)
    setViewerUrl('')
    setIframeLoading(false)
    if (loadTimer.current) { clearTimeout(loadTimer.current); loadTimer.current = null }
  }

  // ── Right-click + DevTools blocking (active while viewer is open) ──
  useEffect(() => {
    function blockMenu(e: MouseEvent) { e.preventDefault() }
    function blockDevTools(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      if (
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (ctrl && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    if (showViewer) {
      document.addEventListener('contextmenu', blockMenu)
      document.addEventListener('keydown', blockDevTools, true)
    }
    return () => {
      document.removeEventListener('contextmenu', blockMenu)
      document.removeEventListener('keydown', blockDevTools, true)
    }
  }, [showViewer])

  if (!movie) return null

  return createPortal(
    <div className="vjs-DownloadModal">
      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} onContextMenu={(e) => e.preventDefault()}>
        <div className="modal-box">
          <div className="modal-header">
            <div className="modal-poster" style={posterThumbStyle}>
              {movie.image ? (
                <img src={movie.image} alt="" className="thumb-img" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(59,156,255,0.7)"><path d="M8 5v14l11-7z"/></svg>
              )}
            </div>
            <div className="modal-info">
              <p className="modal-title">{movie.title}</p>
              <p className="modal-meta">{movie.date} &nbsp;·&nbsp; ⭐ {movie.rating}</p>
              <div className="modal-tags">
                {(movie.genres || []).slice(0, 3).map(g => (
                  <span key={g} className="modal-tag">{g}</span>
                ))}
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {!loggedIn ? (
            <div className="gate-box">
              <div className="gate-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <p className="gate-title">Login Required</p>
              <p className="gate-desc">You need to be logged in to download content.</p>
              <button className="gate-btn gate-btn--primary" onClick={openLogin}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                LOGIN TO DOWNLOAD
              </button>
            </div>
          ) : !subscribed ? (
            <div className="gate-box">
              <div className="gate-icon gate-icon--sub">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffa600" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <p className="gate-title">Payment Required</p>
              <p className="gate-desc">Pay UGX 10,000 for this title or UGX 50,000 for everything.</p>
              <button className="gate-btn gate-btn--sub" onClick={openSubscribe}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                Pay to Download
              </button>
            </div>
          ) : (
            <>
              {(movie.type === 'MOVIES' || movie.type === 'ANIMATION') ? (
                <>
                  <p className="section-label">DOWNLOAD</p>
                  {movie.streamlink ? (
                    <button className="big-dl-btn" onClick={() => openViewer(movie.streamlink as string, movie.title)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      DOWNLOAD MP4
                    </button>
                  ) : (
                    <button className="big-dl-btn big-dl-btn--disabled" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      NO DOWNLOAD LINK
                    </button>
                  )}
                  <p className="dl-note">Available in HD · MP4 format</p>
                </>
              ) : (
                <>
                  <p className="section-label">SELECT EPISODE</p>
                  {movie.episodes && movie.episodes.length > 0 ? (
                    <div className="episode-grid">
                      {movie.episodes.map(ep => (
                        <button
                          key={ep.episodeNumber}
                          className={`ep-box${selectedEpNum === ep.episodeNumber ? ' selected' : ''}${!ep.streamlink ? ' ep-box--no-link' : ''}`}
                          onClick={() => selectEpisode(ep.episodeNumber)}
                        >{ep.episodeNumber}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="ep-empty">No episodes available yet.</div>
                  )}

                  {selectedEpisode && (
                    <div className="ep-selected-info">
                      <span className="ep-selected-label">EP {selectedEpisode.episodeNumber}</span>
                      <span className="ep-selected-title">{selectedEpisode.title}</span>
                    </div>
                  )}

                  {selectedEpisode && selectedEpisode.streamlink ? (
                    <button
                      className="big-dl-btn"
                      onClick={() => openViewer(selectedEpisode.streamlink, movie.title + ' EP ' + selectedEpisode.episodeNumber)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      DOWNLOAD EP {selectedEpisode.episodeNumber}
                    </button>
                  ) : selectedEpisode && !selectedEpisode.streamlink ? (
                    <button className="big-dl-btn big-dl-btn--disabled" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      NO LINK FOR THIS EPISODE
                    </button>
                  ) : (
                    <button className="big-dl-btn big-dl-btn--disabled" disabled>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      SELECT AN EPISODE
                    </button>
                  )}
                </>
              )}
            </>
          )}

          <button className="modal-cancel" onClick={onClose}>CANCEL</button>
        </div>
      </div>

      {showViewer && (
        <div className="viewer-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeViewer() }} onContextMenu={(e) => e.preventDefault()}>
          <div className="viewer-modal">
            <div className="viewer-bar">
              <div className="viewer-bar-left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(59,156,255,0.8)" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span className="viewer-title">{viewerTitle}</span>
              </div>
              <div className="viewer-bar-actions">
                <button className="viewer-close-btn" onClick={closeViewer}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="viewer-frame-wrap" onContextMenu={(e) => e.preventDefault()}>
              {iframeLoading && (
                <div className="iframe-loading-overlay">
                  <div className="iframe-loading-spinner"></div>
                  <p className="iframe-loading-text">Loading, please wait…</p>
                </div>
              )}
              <iframe
                key={viewerUrl}
                src={viewerUrl}
                className="viewer-iframe"
                frameBorder="0"
                referrerPolicy="no-referrer"
                allow="autoplay; fullscreen; encrypted-media; downloads *"
                onLoad={onIframeLoad}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
