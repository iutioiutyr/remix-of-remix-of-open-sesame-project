import { useState } from 'react'
import './Animation.css'
import { dbMusic, type AdminMusic } from '../store/db'
import { useV } from '../reactive'

export default function Music() {
  const songs = useV(() => dbMusic.value)
  const [playing, setPlaying] = useState<AdminMusic | null>(null)

  return (
    <main className="vjs-Animation page-main">
      <div className="page-banner" style={{ background: 'radial-gradient(ellipse 100% 80% at 60% 0%, #3a2200 0%, #1a0d00 50%, #05070d 100%)' }}>
        <div className="page-banner-overlay"></div>
        <div className="page-banner-content">
          <p className="section-kicker mb-2">LISTEN</p>
          <h1 className="page-title">Music</h1>
          <p className="page-subtitle">Luo music, mixes and soundtracks</p>
        </div>
      </div>
      <div className="page-container">
        {playing && (
          <div style={{ margin: '16px 0', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
            <p style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>{playing.title} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>· {playing.artist}</span></p>
            <video key={playing.key} src={playing.streamUrl} poster={playing.posterUrl || undefined} controls autoPlay playsInline style={{ width: '100%', maxHeight: 420, borderRadius: 8, background: '#000' }} />
          </div>
        )}
        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: 'rgba(255,255,255,0.55)' }}>
            <div style={{ fontSize: '2.5rem' }}>🎵</div>
            <h2 className="section-title" style={{ marginTop: 8 }}>Music is coming soon</h2>
            <p style={{ fontSize: '0.85rem', marginTop: 6 }}>New songs will appear here once they are added.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, padding: '16px 0' }}>
            {songs.map(s => (
              <button key={s.key} onClick={() => { setPlaying(s); window.scrollTo({ top: 200, behavior: 'smooth' }) }}
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', padding: 0 }}>
                <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}>
                  {s.posterUrl && <img src={s.posterUrl} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>{s.artist || 'Unknown'}{s.year ? ` · ${s.year}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
