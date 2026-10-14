import { useEffect, useState } from 'react'
import type { Movie } from '../data/movies'
import './MovieCard.css'

const liquidPalettes = [
  'linear-gradient(160deg, #ff0080 0%, #7928ca 40%, #1a0038 100%)',
  'linear-gradient(160deg, #4dd0ff 0%, #0070f3 40%, #001a3a 100%)',
  'linear-gradient(160deg, #ff6b00 0%, #d90429 40%, #2d0010 100%)',
  'linear-gradient(160deg, #00d9a3 0%, #00b4d8 40%, #001a2c 100%)',
  'linear-gradient(160deg, #4dd0ff 0%, #ff6b35 40%, #1a0a00 100%)',
  'linear-gradient(160deg, #a855f7 0%, #ec4899 40%, #1a0026 100%)',
  'linear-gradient(160deg, #06d6a0 0%, #118ab2 40%, #001a2c 100%)',
  'linear-gradient(160deg, #f72585 0%, #7209b7 40%, #1a0030 100%)',
  'linear-gradient(160deg, #fb5607 0%, #ffbe0b 40%, #1a0a00 100%)',
  'linear-gradient(160deg, #3a86ff 0%, #8338ec 40%, #0a0020 100%)',
  'linear-gradient(160deg, #00f5d4 0%, #00bbf9 40%, #001520 100%)',
  'linear-gradient(160deg, #ff4d6d 0%, #c77dff 40%, #1a0030 100%)',
]

export interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const [imgErr, setImgErr] = useState(false)

  // Reset error state whenever the image URL changes (e.g. after data loads)
  useEffect(() => { setImgErr(false) }, [movie.image])

  const gradientIdx = (() => {
    const id = movie.id
    if (typeof id === 'number') return id
    return String(id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  })()

  const posterStyle = {
    background: liquidPalettes[gradientIdx % liquidPalettes.length],
  }

  const typeBadgeClass = movie.type === 'MOVIES' ? 'badge-movie' : movie.type === 'TV SERIES' ? 'badge-series' : 'badge-anim'
  const shortType = movie.type === 'MOVIES' ? 'Movie' : movie.type === 'TV SERIES' ? 'Series' : 'Anime'

  return (
    <div className="poster-card vjs-MovieCard" onClick={onClick}>
      <div className="poster-art">
        {movie.image && !imgErr ? (
          <img src={movie.image} alt={movie.title} className="poster-img" onError={() => setImgErr(true)} />
        ) : null}
        {(!movie.image || imgErr) && (
          <div className="poster-gradient" style={posterStyle}>
            <div className="shimmer-layer"></div>
            <div className="gloss-streak"></div>
          </div>
        )}

        <div className="poster-top">
          <span className={`poster-badge ${typeBadgeClass}`}>{shortType}</span>
          {movie.rating >= 8.5 && <span className="poster-badge badge-hot">HOT</span>}
        </div>

        <div className="poster-bottom">
          <div className="poster-rating">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffc107"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>{movie.rating}</span>
          </div>
        </div>
      </div>

      <div className="poster-info">
        <p className="poster-title">{movie.title}</p>
        <p className="poster-type">{movie.type}</p>
        <button className="poster-dl-btn">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          DOWNLOAD
        </button>
      </div>
    </div>
  )
}
