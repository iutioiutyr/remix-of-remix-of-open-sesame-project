import { useEffect, useState } from 'react'
import type { Movie } from '../data/movies'
import './MovieCard.css'

import VisualButton from './VisualButton'
import { Film } from 'lucide-react'

export interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export default function MovieCard({ movie, onClick }: MovieCardProps) {
  const [imgErr, setImgErr] = useState(false)

  // Reset error state whenever the image URL changes (e.g. after data loads)
  useEffect(() => { setImgErr(false) }, [movie.image])

  const typeBadgeClass = movie.type === 'MOVIES' ? 'badge-movie' : movie.type === 'TV SERIES' ? 'badge-series' : 'badge-anim'
  const shortType = movie.type === 'MOVIES' ? 'Movie' : movie.type === 'TV SERIES' ? 'Series' : 'Anime'

  return (
    <div className="poster-card vjs-MovieCard" onClick={onClick}>
      <div className="poster-art">
        {movie.image && !imgErr ? (
          <img src={movie.image} alt={movie.title} className="poster-img" loading="lazy" width={300} height={450} onError={() => setImgErr(true)} />
        ) : null}
        {(!movie.image || imgErr) && (
          <div className="poster-gradient"><Film size={28} strokeWidth={1} /><span>{movie.title}</span></div>
        )}

        <div className="poster-top">
          <span className={`poster-badge ${typeBadgeClass}`}>{shortType}</span>
          {movie.rating >= 8.5 && <span className="poster-badge badge-hot">HOT</span>}
        </div>

        <div className="poster-bottom">
          <div className="poster-rating">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>{movie.rating}</span>
          </div>
        </div>
      </div>

      <div className="poster-info">
        <p className="poster-title">{movie.title}</p>
        <p className="poster-type">{movie.type}</p>
        <VisualButton className="poster-dl-btn" aria-label={`Download ${movie.title}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          DOWNLOAD
        </VisualButton>
      </div>
    </div>
  )
}
