import './Animation.css'

export default function Music() {
  return (
    <main className="vjs-Animation page-main">
      <div className="page-banner" style={{ background: 'radial-gradient(ellipse 100% 80% at 60% 0%, #3a2200 0%, #1a0d00 50%, #050c08 100%)' }}>
        <div className="page-banner-overlay"></div>
        <div className="page-banner-content">
          <p className="section-kicker mb-2">LISTEN</p>
          <h1 className="page-title">Music</h1>
          <p className="page-subtitle">Luo music, mixes and soundtracks</p>
        </div>
      </div>
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '60px 16px', color: 'rgba(255,255,255,0.55)' }}>
          <div style={{ fontSize: '2.5rem' }}>🎵</div>
          <h2 className="section-title" style={{ marginTop: 8 }}>Music is coming soon</h2>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>New songs will appear here once they are added.</p>
        </div>
      </div>
    </main>
  )
}
