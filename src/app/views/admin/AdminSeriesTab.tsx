import { useMemo, useState } from 'react'
import { dbSeries, addSeries, updateSeries, removeSeries, type AdminSeries, type FbEpisode } from '../../store/db'
import { useV } from '../../reactive'
import './AdminSeriesTab.css'

const CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Reality TV']

interface EpForm { episodeNumber: number; title: string; streamlink: string }
interface SeriesForm { title: string; category: string; image: string; rating: number; year: number; episodes: EpForm[] }

const defaultSf = (): SeriesForm => ({ title: '', category: 'Drama', image: '', rating: 7.5, year: new Date().getFullYear(), episodes: [] })

function catCls(cat: string) {
  const map: Record<string, string> = { Action: 'cat-action', Drama: 'cat-drama', Horror: 'cat-horror', Comedy: 'cat-comedy', Thriller: 'cat-thriller', 'Sci-Fi': 'cat-scifi', Romance: 'cat-romance' }
  return map[cat] || 'cat-default'
}

function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.target as HTMLImageElement
  el.style.display = 'none'
  const placeholder = el.parentElement?.querySelector('.sc-no-poster') as HTMLElement | null
  if (placeholder) placeholder.style.display = 'flex'
}

export default function AdminSeriesTab() {
  const dbSeriesList = useV(() => dbSeries.value)
  const [searchQuery, setSearchQuery] = useState('')
  const [sf, setSf] = useState<SeriesForm>(defaultSf())
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const filteredSeries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return dbSeriesList
    return dbSeriesList.filter(s => s.title.toLowerCase().includes(q))
  }, [dbSeriesList, searchQuery])

  function loadEdit(s: AdminSeries) {
    setEditingKey(s.key)
    setSf({
      title: s.title, category: s.category, image: s.image,
      rating: s.rating, year: s.year,
      episodes: s.episodes.map(e => ({ episodeNumber: e.episodeNumber, title: e.title, streamlink: e.streamlink })),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingKey(null)
    setSf(defaultSf())
    setErrMsg('')
  }

  async function submitForm() {
    if (!sf.title) return
    setSaving(true)
    setErrMsg('')
    try {
      const eps: FbEpisode[] = sf.episodes
        .filter(e => e.title || e.streamlink)
        .map((e, i) => ({ episodeNumber: e.episodeNumber || i + 1, title: e.title || `Episode ${i + 1}`, streamlink: e.streamlink }))

      // Firebase rule requires episodes to exist; store placeholder when empty
      const episodesPayload: any = eps.length > 0 ? eps : { _empty: true }
      const data = {
        title: sf.title, category: sf.category, image: sf.image,
        rating: sf.rating, year: sf.year, episodes: episodesPayload,
        createdAt: new Date().toISOString(),
      }
      if (editingKey !== null) {
        await updateSeries(editingKey, data)
        setEditingKey(null)
      } else {
        await addSeries(data)
      }
      setSf(defaultSf())
    } catch (e: any) {
      setErrMsg(e.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSeriesItem(key: string) {
    if (editingKey === key) cancelEdit()
    await removeSeries(key)
  }

  function updateEp(i: number, patch: Partial<EpForm>) {
    setSf(prev => ({ ...prev, episodes: prev.episodes.map((e, idx) => idx === i ? { ...e, ...patch } : e) }))
  }

  function removeEp(i: number) {
    setSf(prev => ({ ...prev, episodes: prev.episodes.filter((_, idx) => idx !== i) }))
  }

  function addEp() {
    setSf(prev => ({ ...prev, episodes: [...prev.episodes, { episodeNumber: prev.episodes.length + 1, title: '', streamlink: '' }] }))
  }

  return (
    <div className="tab-page vjs-AdminSeriesTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Series</h1>
        <p className="tab-sub">Total: {dbSeriesList.length} series · Firebase RTDB /series</p>
      </div>

      <div className={`form-card${editingKey !== null ? ' editing' : ''}`}>
        <div className="form-title-row">
          <h2 className="form-title">{editingKey !== null ? 'Edit Series' : 'Add New Series'}</h2>
          {editingKey !== null && <button className="cancel-edit-btn" onClick={cancelEdit}>✕ Cancel Edit</button>}
        </div>
        <div className="form-row-3">
          <div className="field">
            <label>Series Title <span className="req">*</span></label>
            <input value={sf.title} onChange={e => setSf({ ...sf, title: e.target.value })} placeholder="Enter series title" />
          </div>
          <div className="field">
            <label>Category</label>
            <div className="select-wrap">
              <select value={sf.category} onChange={e => setSf({ ...sf, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
          <div className="field">
            <label>Poster Image URL</label>
            <input value={sf.image} onChange={e => setSf({ ...sf, image: e.target.value })} placeholder="https://example.com/poster.jpg" />
          </div>
        </div>
        <div className="form-row-2">
          <div className="field">
            <label>Rating (0-10)</label>
            <input value={sf.rating} onChange={e => setSf({ ...sf, rating: Number(e.target.value) })} type="number" min="0" max="10" step="0.1" placeholder="7.5" />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={sf.year} onChange={e => setSf({ ...sf, year: Number(e.target.value) })} type="number" min="1900" max="2099" placeholder="2025" />
          </div>
        </div>

        <div className="ep-section">
          <div className="ep-section-label">Episodes</div>
          {sf.episodes.map((ep, i) => (
            <div key={i} className="ep-row">
              <span className="ep-num-label">Ep {i + 1}</span>
              <input value={ep.title} onChange={e => updateEp(i, { title: e.target.value })} placeholder="Episode title" className="ep-input" />
              <input value={ep.streamlink} onChange={e => updateEp(i, { streamlink: e.target.value })} placeholder="Download link URL" className="ep-input" />
              <button className="ep-remove" onClick={() => removeEp(i)}>✕</button>
            </div>
          ))}
          <button className="btn-add-ep" onClick={addEp}>+ Add Episode</button>
        </div>

        {errMsg && <p className="err-msg">{errMsg}</p>}
        <button className="btn-add-series" onClick={submitForm} disabled={saving || !sf.title}>
          {saving ? 'Saving...' : (editingKey !== null ? 'Update Series' : 'Add Series')}
        </button>
      </div>

      <div className="search-bar-wrap">
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} type="text" placeholder="Search series by title…" className="search-input" />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <span className="search-count">{filteredSeries.length} / {dbSeriesList.length}</span>
      </div>

      <div className="series-grid">
        {filteredSeries.map(s => (
          <div key={s.key} className={`series-card${editingKey === s.key ? ' is-editing' : ''}`}>
            <div className="sc-poster">
              {s.image ? (
                <img src={s.image} alt="" className="sc-img" onError={onImgErr} />
              ) : (
                <div className="sc-no-poster">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 2H8l-2 5h12z" /></svg>
                </div>
              )}
              <span className={`sc-cat-badge ${catCls(s.category)}`}>{s.category}</span>
              <span className="sc-ep-badge">{s.episodes.length} Eps</span>
            </div>
            <div className="sc-body">
              <p className="sc-title">{s.title}</p>
              <p className="sc-meta">⭐ {s.rating} · {s.year}</p>
              <div className="sc-actions">
                <button className="sc-btn-edit" onClick={() => loadEdit(s)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                {pendingDelete === s.key ? (
                  <>
                    <button className="sc-btn-del confirming" onClick={() => deleteSeriesItem(s.key)}>Sure?</button>
                    <button className="sc-btn-cancel" onClick={() => setPendingDelete(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="sc-btn-del" onClick={() => setPendingDelete(s.key)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredSeries.length === 0 && (
          <div className="empty">{searchQuery ? 'No series match your search.' : 'No series added yet. Use the form above to add your first series.'}</div>
        )}
      </div>
    </div>
  )
}
