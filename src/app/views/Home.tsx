import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import MovieCard from '../components/MovieCard'
import DownloadModal from '../components/DownloadModal'
import type { Movie } from '../data/movies'
import { publicAll, dbLoading, dbCarousel } from '../store/db'
import { useV } from '../reactive'
import './Home.css'

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const externalQuery = useMemo(() => {
    const params = new URLSearchParams(location.search as any)
    return params.get('q') || ''
  }, [location.search])

  const [mobileSearch, setMobileSearch] = useState('')
  function doMobileSearch() {
    if (mobileSearch.trim()) {
      navigate({ to: '/', search: { q: mobileSearch.trim() } as any })
    }
  }

  const all = useV(() => publicAll.value)
  const loading = useV(() => dbLoading.value)
  const carousel = useV(() => dbCarousel.value)

  const searchResults = useMemo(() => {
    if (!externalQuery) return []
    const q = externalQuery.toLowerCase()
    return all.filter((m) => m.title.toLowerCase().includes(q))
  }, [externalQuery, all])

  const [downloadTarget, setDownloadTarget] = useState<Movie | null>(null)
  function openDownload(item: Movie) {
    setDownloadTarget(item)
  }

  // Hero carousel
  const heroSlides = useMemo(
    () =>
      carousel.map((s) => ({
        title: s.title,
        type: s.subtitle || 'STREAMING',
        imageUrl: s.imageUrl || '',
        bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #0d2a4a 0%, #071220 60%, #050c08 100%)',
        accent: '#00d9a3',
      })),
    [carousel],
  )

  const [currentSlide, setCurrentSlide] = useState(0)
  const SLIDE_MS = 6000
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  function goToSlide(i: number) {
    setCurrentSlide(i)
  }
  function nextSlide() {
    setCurrentSlide((cur) => (heroSlides.length > 0 ? (cur + 1) % heroSlides.length : cur))
  }

  useEffect(() => {
    if (currentSlide >= heroSlides.length) setCurrentSlide(0)
  }, [heroSlides.length])

  useEffect(() => {
    autoTimer.current = setInterval(nextSlide, SLIDE_MS)
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current)
    }
  }, [heroSlides.length])

  function particleStyle(n: number): React.CSSProperties {
    return {
      left: `${(n * 37 + 11) % 100}%`,
      top: `${(n * 53 + 7) % 100}%`,
      width: `${2 + (n % 3)}px`,
      height: `${2 + (n % 3)}px`,
      opacity: 0.06 + (n % 5) * 0.03,
      animationDelay: `${n * 0.5}s`,
    }
  }

  return (
    <main className="vjs-Home relative w-full overflow-x-hidden">
      {/* HERO SLIDESHOW */}
      <section className="hero-section">
        {heroSlides.length > 0 ? (
          heroSlides.map((slide, i) => (
            <div key={i} className={'hero-slide' + (currentSlide === i ? ' active' : '')}>
              <div className="hero-slide-bg" style={{ background: slide.bg }}>
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    className="hero-slide-img"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="hero-slide active">
            <div className="hero-slide-bg hero-skeleton-bg"></div>
          </div>
        )}

        <div className="hero-particles">
          {Array.from({ length: 14 }, (_, idx) => idx + 1).map((n) => (
            <div key={n} className="particle" style={particleStyle(n)}></div>
          ))}
        </div>

        <div className="hero-content-wrap">
          <div className="hero-content">
            {heroSlides.length > 0 ? (
              <>
                <div key={currentSlide} className="hero-text-block">
                  <p
                    className="hero-category"
                    style={{ color: heroSlides[currentSlide]?.accent || '#00d9a3' }}
                  >
                    {heroSlides[currentSlide]?.type || ''}
                  </p>
                  <h1 className="hero-title">{heroSlides[currentSlide]?.title || ''}</h1>
                </div>
                <div className="hero-dots">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      className={'hero-dot' + (currentSlide === i ? ' active' : '')}
                      onClick={() => goToSlide(i)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="hero-text-block">
                <div className="skel-line skel-line--sm mb-3"></div>
                <div className="skel-line skel-line--lg mb-2"></div>
                <div className="skel-line skel-line--md"></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MOBILE SEARCH BAR (below carousel, hidden on desktop) */}
      <div className="mobile-search-bar">
        <form
          className="mobile-search-form"
          onSubmit={(e) => {
            e.preventDefault()
            doMobileSearch()
          }}
        >
          <svg className="ms-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            type="text"
            placeholder="Search movies, series, anime..."
            className="ms-input"
            onKeyUp={(e) => {
              if (e.key === 'Enter') doMobileSearch()
            }}
          />
          <button type="submit" className="ms-btn">
            GO
          </button>
        </form>
      </div>

      {/* CONTENT GRIDS */}
      <div className="content-wrap">
        {externalQuery && searchResults.length > 0 ? (
          <>
            <div className="section-header">
              <div>
                <p className="section-kicker">RESULTS</p>
                <h2 className="section-title">Results for "{externalQuery}"</h2>
              </div>
              <span className="count-badge">{searchResults.length}</span>
            </div>
            <div className="poster-grid">
              {searchResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={() => openDownload(movie)} />
              ))}
            </div>
          </>
        ) : externalQuery && searchResults.length === 0 ? (
          <div className="empty-state">
            <svg width="52" height="52" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-20">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-base font-bold text-white">No results for "{externalQuery}"</h3>
            <p className="mt-1 text-sm text-white/40">Try a different keyword</p>
          </div>
        ) : loading ? (
          <>
            <div className="section-header">
              <div>
                <div className="skel-line skel-line--xs mb-2"></div>
                <div className="skel-line skel-line--md"></div>
              </div>
            </div>
            <div className="poster-grid">
              {Array.from({ length: 16 }, (_, idx) => idx + 1).map((n) => (
                <div key={n} className="skel-card">
                  <div className="skel-card-art"></div>
                  <div className="skel-card-body">
                    <div className="skel-line skel-line--full mb-1"></div>
                    <div className="skel-line skel-line--half"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <section className="content-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">ALL CONTENT</p>
                <h2 className="section-title">Movies, Series &amp; Animation</h2>
              </div>
              <span className="count-badge">{all.length}</span>
            </div>
            {all.length > 0 ? (
              <div className="poster-grid">
                {all.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onClick={() => openDownload(movie)} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="loading-msg">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>LOADING PLEASE WAIT</p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <DownloadModal movie={downloadTarget} onClose={() => setDownloadTarget(null)} />
    </main>
  )
}
