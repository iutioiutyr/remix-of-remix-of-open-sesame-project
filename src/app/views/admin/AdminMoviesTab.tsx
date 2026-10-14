import { useMemo, useState } from 'react'
import { dbMovies, addMovie, updateMovie, removeMovie, type AdminMovie } from '../../store/db'
import { useV } from '../../reactive'
import './AdminMoviesTab.css'

const CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Crime', 'Documentary']

interface FormState {
  title: string
  category: string
  streamlink: string
  image: string
  rating: number
  year: number
  isTrending: boolean
}

const defaultForm = (): FormState => ({
  title: '', category: 'Action', streamlink: '', image: '',
  rating: 7.5, year: new Date().getFullYear(), isTrending: false,
})

function catCls(cat: string) {
  const map: Record<string, string> = { Action: 'cat-action', Animation: 'cat-anim', Drama: 'cat-drama', Horror: 'cat-horror', Comedy: 'cat-comedy', Thriller: 'cat-thriller', 'Sci-Fi': 'cat-scifi', Romance: 'cat-romance' }
  return map[cat] || 'cat-default'
}

function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.target as HTMLImageElement
  el.style.display = 'none'
  const placeholder = el.parentElement?.querySelector('.mc-no-poster') as HTMLElement | null
  if (placeholder) placeholder.style.display = 'flex'
}

export default function AdminMoviesTab() {
  const dbMoviesList = useV(() => dbMovies.value)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<FormState>(defaultForm())
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return dbMoviesList
    return dbMoviesList.filter(m => m.title.toLowerCase().includes(q))
  }, [dbMoviesList, searchQuery])

  function loadEdit(m: AdminMovie) {
    setEditingKey(m.key)
    setForm({ title: m.title, category: m.category, streamlink: m.streamlink, image: m.image, rating: m.rating, year: m.year, isTrending: m.isTrending })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingKey(null)
    setForm(defaultForm())
    setErrMsg('')
  }

  async function submitForm() {
    if (!form.title || !form.streamlink) return
    setSaving(true)
    setErrMsg('')
    try {
      const data = {
        title: form.title,
        category: form.category,
        streamlink: form.streamlink,
        image: form.image,
        rating: form.rating,
        year: form.year,
        isTrending: form.isTrending,
        createdAt: new Date().toISOString(),
      }
      if (editingKey !== null) {
        await updateMovie(editingKey, data)
        setEditingKey(null)
      } else {
        await addMovie(data)
      }
      setForm(defaultForm())
    } catch (e: any) {
      setErrMsg(e.message || 'Failed to save. Check your connection.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMovie(key: string) {
    if (editingKey === key) cancelEdit()
    await removeMovie(key)
  }

  async function toggleTrending(m: AdminMovie) {
    await updateMovie(m.key, { isTrending: !m.isTrending })
  }

  return (
    <div className="tab-page vjs-AdminMoviesTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Movies</h1>
        <p className="tab-sub">Total: {dbMoviesList.length} movies · Firebase RTDB /movies</p>
      </div>

      <div className={`form-card${editingKey !== null ? ' editing' : ''}`}>
        <div className="form-title-row">
          <h2 className="form-title">{editingKey !== null ? 'Edit Movie' : 'Add New Movie'}</h2>
          {editingKey !== null && <button className="cancel-edit-btn" onClick={cancelEdit}>✕ Cancel Edit</button>}
        </div>
        <div className="form-row-3">
          <div className="field">
            <label>Movie Title <span className="req">*</span></label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter movie title" />
          </div>
          <div className="field">
            <label>Category <span className="req">*</span></label>
            <div className="select-wrap">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <div className="field">
            <label>Download URL <span className="req">*</span></label>
            <input value={form.streamlink} onChange={e => setForm({ ...form, streamlink: e.target.value })} placeholder="https://example.com/movie.mp4" />
          </div>
        </div>
        <div className="form-row-3">
          <div className="field">
            <label>Rating (0-10)</label>
            <input value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} type="number" min="0" max="10" step="0.1" placeholder="7.5" />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} type="number" min="1900" max="2099" placeholder="2025" />
          </div>
          <div className="field">
            <label>Poster Image URL <span className="req">*</span></label>
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/poster.jpg" />
          </div>
        </div>
        <div className="check-row">
          <label className="check-label">
            <input type="checkbox" checked={form.isTrending} onChange={e => setForm({ ...form, isTrending: e.target.checked })} className="check-input" />
            <span className={`check-box${form.isTrending ? ' checked' : ''}`}>
              {form.isTrending && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </span>
            Mark as Trending
          </label>
        </div>
        {errMsg && <p className="err-msg">{errMsg}</p>}
        <button className="btn-add" onClick={submitForm} disabled={saving || !form.title || !form.streamlink}>
          {saving ? 'Saving...' : (editingKey !== null ? 'Update Movie' : 'Add Movie')}
        </button>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search movies by title…" className="search-input" />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <span className="search-count">{filteredMovies.length} / {dbMoviesList.length}</span>
      </div>

      <div className="movies-grid">
        {filteredMovies.map(m => (
          <div key={m.key} className={`movie-card${editingKey === m.key ? ' is-editing' : ''}`}>
            <div className="mc-poster">
              {m.image ? (
                <img src={m.image} alt="" className="mc-img" onError={onImgErr} />
              ) : (
                <div className="mc-no-poster">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M7 2v20M17 2v20M2 12h20" /></svg>
                </div>
              )}
              <span className={`mc-cat-badge ${catCls(m.category)}`}>{m.category}</span>
              <span className="mc-rating-badge">{m.rating}</span>
              {m.isTrending && <span className="mc-trend-badge">TRENDING</span>}
            </div>
            <div className="mc-body">
              <p className="mc-title">{m.title}</p>
              <p className="mc-year">{m.year}</p>
              <div className="mc-actions">
                <button className="mc-btn-edit" onClick={() => loadEdit(m)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                <button className="mc-btn-trend" onClick={() => toggleTrending(m)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                  {m.isTrending ? 'Untrend' : 'Trending'}
                </button>
                {pendingDelete === m.key ? (
                  <>
                    <button className="mc-btn-del confirming" onClick={() => deleteMovie(m.key)}>Sure?</button>
                    <button className="mc-btn-cancel" onClick={() => setPendingDelete(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="mc-btn-del" onClick={() => setPendingDelete(m.key)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredMovies.length === 0 && (
          <div className="empty">{searchQuery ? 'No movies match your search.' : 'No movies added yet. Use the form above to add your first movie.'}</div>
        )}
      </div>
    </div>
  )
}
