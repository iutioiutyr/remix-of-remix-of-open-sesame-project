import { useState } from 'react'
import './AdminMusicTab.css'
import { dbMusic, addMusic, removeMusic } from '../../store/db'
import { useV } from '../../reactive'

const GENRES = ['Afrobeats', 'Hip-Hop', 'R&B', 'Pop', 'Gospel', 'Reggae', 'Electronic', 'Other']


const defaultForm = () => ({ title: '', artist: '', genre: 'Afrobeats', streamUrl: '', posterUrl: '', year: new Date().getFullYear() })

function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).style.display = 'none'
}

export default function AdminMusicTab() {
  const items = useV(() => dbMusic.value)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(defaultForm())

  async function addItem() {
    setBusy(true)
    try { await addMusic(form) } catch (e: any) { alert('Upload failed: ' + (e?.message || e)); setBusy(false); return }
    setBusy(false)
    setForm(defaultForm())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function deleteItem(id: string) {
    if (confirm('Delete this song?')) removeMusic(id)
  }

  return (
    <div className="tab-page vjs-AdminMusicTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Music</h1>
        <p className="tab-sub">Upload music videos</p>
      </div>
      <div className="form-card">
        <h2 className="form-title">Add Music Video</h2>
        <div className="form-grid">
          <div className="field">
            <label>Title <span className="req">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Song or video title" />
          </div>
          <div className="field">
            <label>Artist</label>
            <input value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="Artist name" />
          </div>
          <div className="field col-2">
            <label>Stream Link <span className="req">*</span></label>
            <input value={form.streamUrl} onChange={e => setForm({ ...form, streamUrl: e.target.value })} placeholder="https://example.com/stream/music.mp4" />
          </div>
          <div className="field col-2">
            <label>Thumbnail URL</label>
            <input value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://example.com/thumb/image.jpg" />
          </div>
          <div className="field">
            <label>Genre</label>
            <div className="select-wrap">
              <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <div className="field">
            <label>Year</label>
            <input value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} type="number" placeholder="2025" />
          </div>
        </div>
        <button className="btn-add" onClick={addItem} disabled={busy || !form.title || !form.streamUrl}>Add Music Video</button>
        {saved && <p className="save-msg">✓ Music video added</p>}
      </div>
      <div className="items-grid">
        {items.map(item => (
          <div key={item.key} className="item-card">
            <div className="ic-poster">
              {item.posterUrl ? (
                <img src={item.posterUrl} alt="" className="ic-img" onError={onImgErr} />
              ) : (
                <div className="ic-no-poster">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </div>
              )}
              <span className="ic-genre">{item.genre}</span>
            </div>
            <div className="ic-body">
              <p className="ic-title">{item.title}</p>
              <p className="ic-meta">{item.artist || 'Unknown'} · {item.year}</p>
              <button className="ic-btn-del" onClick={() => deleteItem(item.key)}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="empty">No music videos added yet.</div>}
      </div>
    </div>
  )
}
