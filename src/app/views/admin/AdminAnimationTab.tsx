import { useMemo, useState } from 'react'
import { dbAnimation, addAnimation, updateAnimation, removeAnimation, type AdminAnimation } from '../../store/db'
import { useV } from '../../reactive'
import './AdminAnimationTab.css'

interface AnimationForm {
  title: string
  category: string
  streamlink: string
  image: string
  rating: number
  year: number
  isTrending: boolean
}

const defaultForm = (): AnimationForm => ({
  title: '',
  category: 'Anime',
  streamlink: '',
  image: '',
  rating: 7.5,
  year: new Date().getFullYear(),
  isTrending: false,
})

function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}

export default function AdminAnimationTab() {
  const dbAnimationList = useV(() => dbAnimation.value)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<AnimationForm>(defaultForm())
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const filteredAnimation = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return dbAnimationList
    return dbAnimationList.filter((a) => a.title.toLowerCase().includes(q))
  }, [dbAnimationList, searchQuery])

  function loadEdit(item: AdminAnimation) {
    setEditingKey(item.key)
    setForm({
      title: item.title,
      category: item.category,
      streamlink: item.streamlink,
      image: item.image,
      rating: item.rating,
      year: item.year,
      isTrending: item.isTrending,
    })
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
      const data = { ...form, createdAt: new Date().toISOString() }
      if (editingKey !== null) {
        await updateAnimation(editingKey, data)
        setEditingKey(null)
      } else {
        await addAnimation(data)
      }
      setForm(defaultForm())
    } catch (e: any) {
      setErrMsg(e.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(key: string) {
    if (editingKey === key) cancelEdit()
    await removeAnimation(key)
  }

  return (
    <div className="tab-page vjs-AdminAnimationTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Animation</h1>
        <p className="tab-sub">Total: {dbAnimationList.length} items · Firebase RTDB /animation</p>
      </div>
      <div className={['form-card', editingKey !== null ? 'editing' : ''].join(' ').trim()}>
        <div className="form-title-row">
          <h2 className="form-title">{editingKey !== null ? 'Edit Animation' : 'Add Animation'}</h2>
          {editingKey !== null ? (
            <button className="cancel-edit-btn" onClick={cancelEdit}>✕ Cancel</button>
          ) : null}
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Title <span className="req">*</span></label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Enter title"
            />
          </div>
          <div className="field">
            <label>Category</label>
            <div className="select-wrap">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="Anime">Anime</option>
                <option value="Animation">Animation</option>
                <option value="Cartoon">Cartoon</option>
              </select>
              <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div className="field col-2">
            <label>Stream Link <span className="req">*</span></label>
            <input
              value={form.streamlink}
              onChange={(e) => setForm((f) => ({ ...f, streamlink: e.target.value }))}
              placeholder="https://example.com/anime.mp4"
            />
          </div>
          <div className="field col-2">
            <label>Poster Image URL</label>
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://example.com/poster.jpg"
            />
          </div>
          <div className="field">
            <label>Rating (0–10)</label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
              placeholder="7.5"
            />
          </div>
          <div className="field">
            <label>Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
              placeholder="2025"
            />
          </div>
        </div>
        <div className="check-row">
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.isTrending}
              onChange={(e) => setForm((f) => ({ ...f, isTrending: e.target.checked }))}
              className="check-input"
            />
            <span className={['check-box', form.isTrending ? 'checked' : ''].join(' ').trim()}>
              {form.isTrending ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : null}
            </span>
            Mark as Trending
          </label>
        </div>
        {errMsg ? <p className="err-msg">{errMsg}</p> : null}
        <button className="btn-add" onClick={submitForm} disabled={saving || !form.title || !form.streamlink}>
          {saving ? 'Saving...' : editingKey !== null ? 'Update' : 'Add Animation'}
        </button>
      </div>
      <div className="search-bar-wrap">
        <div className="search-bar">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Search animation by title…"
            className="search-input"
          />
          {searchQuery ? (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          ) : null}
        </div>
        <span className="search-count">{filteredAnimation.length} / {dbAnimationList.length}</span>
      </div>

      <div className="items-grid">
        {filteredAnimation.map((item) => (
          <div className={['item-card', editingKey === item.key ? 'is-editing' : ''].join(' ').trim()} key={item.key}>
            <div className="ic-poster">
              {item.image ? (
                <img src={item.image} alt="" className="ic-img" onError={onImgErr} />
              ) : (
                <div className="ic-no-poster">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="rgba(255,255,255,0.15)"/></svg>
                </div>
              )}
              <span className="ic-cat">{item.category}</span>
              {item.isTrending ? <span className="ic-trend">TRENDING</span> : null}
            </div>
            <div className="ic-body">
              <p className="ic-title">{item.title}</p>
              <p className="ic-meta">⭐ {item.rating} · {item.year}</p>
              <div className="ic-actions">
                <button className="ic-btn-edit" onClick={() => loadEdit(item)}>Edit</button>
                {pendingDelete === item.key ? (
                  <>
                    <button className="ic-btn-del confirming" onClick={() => deleteItem(item.key)}>Sure?</button>
                    <button className="ic-btn-cancel" onClick={() => setPendingDelete(null)}>✕</button>
                  </>
                ) : (
                  <button className="ic-btn-del" onClick={() => setPendingDelete(item.key)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredAnimation.length === 0 ? (
          <div className="empty">{searchQuery ? 'No animation matches your search.' : 'No animation added yet.'}</div>
        ) : null}
      </div>
    </div>
  )
}
