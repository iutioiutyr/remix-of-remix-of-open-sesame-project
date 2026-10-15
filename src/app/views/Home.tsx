import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import MovieCard from '../components/MovieCard'
import DownloadModal from '../components/DownloadModal'
import type { Movie } from '../data/movies'
import { publicAll, dbLoading, dbCarousel } from '../store/db'
import { useV } from '../reactive'
import VisualButton from '../components/VisualButton'
import { ArrowLeft, ArrowRight, Pause, Play, Search } from 'lucide-react'
import cinemaFeature from '../../assets/cinema-feature.jpg'
import './Home.css'

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const externalQuery = useMemo(() => {
    const params = new URLSearchParams(location.searchStr)
    return params.get('q') || ''
  }, [location.searchStr])

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

  const heroSlides = useMemo(() => carousel.length > 0
    ? carousel.map(s => ({ title: s.title, type: s.subtitle || 'Featured', imageUrl: s.imageUrl || cinemaFeature }))
    : [{ title: 'LUO NIGER', type: 'Movies · Series · Music', imageUrl: cinemaFeature }], [carousel])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const SLIDE_MS = 6000
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeSlide = heroSlides[currentSlide] ?? heroSlides[0]
  function goToSlide(i: number) { setCurrentSlide(i) }
  useEffect(() => { setCurrentSlide(0) }, [heroSlides.length])
  useEffect(() => {
    if (paused || heroSlides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    autoTimer.current = setInterval(() => setCurrentSlide(cur => (cur + 1) % heroSlides.length), SLIDE_MS)
    return () => { if (autoTimer.current) clearInterval(autoTimer.current) }
  }, [heroSlides.length, paused, currentSlide])
  const contentSections = useMemo(() => [
    { title: 'Movies', kicker: 'THE BIG SCREEN', items: all.filter(m => m.type === 'MOVIES'), to: '/movies' as const },
    { title: 'Series', kicker: 'ONE MORE EPISODE', items: all.filter(m => m.type === 'TV SERIES'), to: '/series' as const },
    { title: 'Animation', kicker: 'A WORLD OF IMAGINATION', items: all.filter(m => m.type === 'ANIMATION'), to: '/animation' as const },
  ].filter(section => section.items.length > 0), [all])

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
      <section className="hero-section" aria-roledescription="carousel" aria-label="Featured titles">
        {heroSlides.map((slide, i) => (
          <div key={`${slide.title}-${i}`} className={'hero-slide' + (currentSlide === i ? ' active' : '')} aria-hidden={currentSlide !== i}>
            <img src={slide.imageUrl} alt="" width={1600} height={912} className="hero-slide-img" fetchPriority={i === 0 ? 'high' : 'auto'} onError={e => { if (e.currentTarget.src !== new URL(cinemaFeature, window.location.href).href) e.currentTarget.src = cinemaFeature }} />
          </div>
        ))}
        <div className="hero-scrim" />
        <div className="hero-content-wrap">
          <div className="hero-content">
            <p className="hero-category">{activeSlide?.type}</p>
            <h1 className="hero-title">{activeSlide?.title}</h1>
            {carousel.length === 0 && <p className="hero-description">Luo movies. Great stories. Your favourite music.</p>}
            <Link to="/movies" className="hero-browse">Explore movies <ArrowRight size={17} /></Link>
          </div>
        </div>
        <div className="hero-footer">
          <span className="hero-edition">LUO NIGER <span> / </span> THE COLLECTION</span>
          {heroSlides.length > 1 && <div className="hero-controls">
            <div className="hero-dots">{heroSlides.map((slide, i) => <VisualButton key={i} aria-label={`Show ${slide.title}`} aria-pressed={currentSlide === i} className={'hero-dot' + (currentSlide === i ? ' active' : '')} onClick={() => goToSlide(i)} />)}</div>
            <span className="hero-counter">{String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}</span>
            <VisualButton className="hero-arrow" aria-label="Previous slide" onClick={() => goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length)}><ArrowLeft size={16} /></VisualButton>
            <VisualButton className="hero-arrow" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused(!paused)}>{paused ? <Play size={14} /> : <Pause size={14} />}</VisualButton>
            <VisualButton className="hero-arrow" aria-label="Next slide" onClick={() => goToSlide((currentSlide + 1) % heroSlides.length)}><ArrowRight size={16} /></VisualButton>
          </div>}
        </div>
      </section>
      <nav className="collection-nav" aria-label="Browse collection">
        <Link to="/movies">Movies <ArrowRight size={14} /></Link>
        <Link to="/series">Series <ArrowRight size={14} /></Link>
        <Link to="/animation">Animation <ArrowRight size={14} /></Link>
        <Link to="/music">Music <ArrowRight size={14} /></Link>
      </nav>
      <div className="mobile-search-bar">
        <form className="mobile-search-form" onSubmit={e => { e.preventDefault(); doMobileSearch() }}>
          <Search className="ms-icon" />
          <input aria-label="Search titles" value={mobileSearch} onChange={e => setMobileSearch(e.target.value)} placeholder="Search movies, series, animation…" className="ms-input" />
          <VisualButton type="submit" className="ms-btn" aria-label="Search"><ArrowRight size={16} /></VisualButton>
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
            <h3 className="mt-4 text-base font-bold text-foreground">No results for "{externalQuery}"</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different keyword</p>
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
          <>
            {contentSections.length > 0 ? contentSections.map(section => (
              <section className="content-section" key={section.title}>
                <div className="section-header">
                  <div><p className="section-kicker">{section.kicker}</p><h2 className="section-title">{section.title}</h2></div>
                  <Link to={section.to} className="section-view-all">View all <ArrowRight size={15} /></Link>
                </div>
                <div className="poster-grid">{section.items.slice(0, 12).map(movie => <MovieCard key={movie.id} movie={movie} onClick={() => openDownload(movie)} />)}</div>
              </section>
            )) : <section className="content-section">
              <div className="section-header"><div><p className="section-kicker">THE COLLECTION</p><h2 className="section-title">Movies, Series &amp; Animation</h2></div></div>
              <div className="catalog-empty"><span className="catalog-empty-mark"><Play size={22} /></span><h3>The next story is on its way</h3><p>New titles will appear here soon.</p></div>
            </section>}
          </>
        )}
      </div>

      <DownloadModal movie={downloadTarget} onClose={() => setDownloadTarget(null)} />
    </main>
  )
}
