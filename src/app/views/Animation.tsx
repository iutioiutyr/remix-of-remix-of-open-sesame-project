import { useState, useMemo } from 'react'
import MovieCard from '../components/MovieCard'
import DownloadModal from '../components/DownloadModal'
import type { Movie } from '../data/movies'
import { publicAnimation, dbLoading } from '../store/db'
import { useV } from '../reactive'
import './Animation.css'

export default function Animation() {
  const [downloadTarget, setDownloadTarget] = useState<Movie | null>(null)
  function openDownload(m: Movie) {
    setDownloadTarget(m)
  }

  const list = useV(() => publicAnimation.value)
  const loading = useV(() => dbLoading.value)

  const genres = useMemo(() => {
    const cats = [...new Set(list.map((m) => m.category || '').filter(Boolean))]
    return ['ALL', ...cats]
  }, [list])

  const [activeGenre, setActiveGenre] = useState('ALL')

  const filteredList = useMemo(
    () => (activeGenre === 'ALL' ? list : list.filter((m) => m.category === activeGenre)),
    [activeGenre, list],
  )

  return (
    <main className="vjs-Animation page-main">
      <div
        className="page-banner"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 60% 0%, #1a0a3a 0%, #0f0620 50%, #05070d 100%)',
        }}
      >
        <div className="page-banner-overlay"></div>
        <div className="page-banner-content">
          <p className="section-kicker mb-2">BROWSE</p>
          <h1 className="page-title">Animation &amp; Anime</h1>
          <p className="page-subtitle">Download animated films and anime series in stunning HD quality</p>
        </div>
      </div>

      <div className="page-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <div className="filter-row">
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={'filter-chip' + (activeGenre === genre ? ' active' : '')}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="section-header">
              <div>
                <p className="section-kicker">ALL ANIMATION</p>
                <h2 className="section-title">{activeGenre === 'ALL' ? 'Full Collection' : activeGenre}</h2>
              </div>
              <span className="count-badge">{filteredList.length} TITLES</span>
            </div>
            {filteredList.length > 0 ? (
              <div className="poster-grid">
                {filteredList.map((movie) => (
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
          </>
        )}
      </div>

      <DownloadModal movie={downloadTarget} onClose={() => setDownloadTarget(null)} />
    </main>
  )
}
