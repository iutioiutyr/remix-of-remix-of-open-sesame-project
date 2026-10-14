import { useState } from 'react'
import './AdminOriginalsTab.css'

const CATEGORIES = ['Action', 'Drama', 'Comedy', 'Thriller', 'Documentary', 'Sci-Fi']

interface OriginalItem { id: number; title: string; category: string; streamUrl: string; posterUrl: string; rating: number; year: number }

let nextId = 1

const defaultForm = () => ({ title: '', category: 'Drama', streamUrl: '', posterUrl: '', rating: 7.5, year: new Date().getFullYear() })

function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).style.display = 'none'
}

export default function AdminOriginalsTab() {
  const [items, setItems] = useState<OriginalItem[]>([])
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState(defaultForm())

  function addItem() {
    setItems(prev => [...prev, { id: nextId++, ...form }])
    setForm(defaultForm())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function deleteItem(id: number) {
    setItems(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="tab-page vjs-AdminOriginalsTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Originals</h1>
        <p className="tab-sub">Upload exclusive original content</p>
      </div>
      <div className="form-card">
        <h2 className="form-title">Add New Original</h2>
        <div className="form-grid">
          <div className="field">
            <label>Title <span className="req">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter title" />
          </div>
          <div className="field">
            <label>Category</label>
            <div className="select-wrap">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <div className="field col-2">
            <label>Stream Link <span className="req">*</span></label>
            <input value={form.streamUrl} onChange={e => setForm({ ...form, streamUrl: e.target.value })} placeholder="https://example.com/stream/original.mp4" />
          </div>
          <div className="field col-2">
            <label>Poster Image URL</label>
            <input value={form.posterUrl} onChange={e => setForm({ ...form, posterUrl: e.target.value })} placeholder="https://example.com/poster/image.jpg" />
          </div>
          <div className="field">
            <label>Rating (0–10)</label>
            <input value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} type="number" min="0" max="10" step="0.1" placeholder="7.5" />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} type="number" placeholder="2025" />
          </div>
        </div>
        <button className="btn-add" onClick={addItem} disabled={!form.title || !form.streamUrl}>Add Original</button>
        {saved && <p className="save-msg">✓ Original added successfully</p>}
      </div>
      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <div className="ic-poster">
              {item.posterUrl ? (
                <img src={item.posterUrl} alt="" className="ic-img" onError={onImgErr} />
              ) : (
                <div className="ic-no-poster">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                </div>
              )}
              <span className="ic-cat">{item.category}</span>
            </div>
            <div className="ic-body">
              <p className="ic-title">{item.title}</p>
              <p className="ic-meta">⭐ {item.rating} · {item.year}</p>
              <button className="ic-btn-del" onClick={() => deleteItem(item.id)}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="empty">No originals added yet.</div>}
      </div>
    </div>
  )
}
