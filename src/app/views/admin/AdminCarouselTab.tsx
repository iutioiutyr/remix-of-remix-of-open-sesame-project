import { useState } from 'react';
import { dbCarousel, addCarousel, updateCarousel, removeCarousel, type AdminCarousel } from '../../store/db';
import { toDisplayImage } from '../../lib/utils';
import { useV } from '../../reactive';
import './AdminCarouselTab.css';

export default function AdminCarouselTab() {
  const carousel = useV(() => dbCarousel.value);

  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkContent: 'No Link' });
  const [editData, setEditData] = useState<AdminCarousel | null>(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function addItem() {
    if (!form.title || !form.imageUrl) return;
    setSaving(true);
    setErrMsg('');
    try {
      await addCarousel({ ...form, createdAt: new Date().toISOString() });
      setForm({ title: '', subtitle: '', imageUrl: '', linkContent: 'No Link' });
    } catch (e: any) {
      setErrMsg(e.message || 'Failed to add.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(key: string) {
    await removeCarousel(key);
  }

  function startEdit(item: AdminCarousel) {
    setEditData({ ...item });
  }

  async function saveEdit() {
    if (!editData) return;
    await updateCarousel(editData.key, {
      title: editData.title,
      subtitle: editData.subtitle,
      imageUrl: editData.imageUrl,
      linkContent: editData.linkContent,
    });
    setEditData(null);
  }

  function onImgErr(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  return (
    <div className="tab-page vjs-AdminCarouselTab">
      <div className="tab-header">
        <h1 className="tab-title">Manage Carousel</h1>
        <p className="tab-sub">Total: {carousel.length} items · Firebase RTDB /carousel</p>
      </div>

      <div className="form-card">
        <h2 className="form-title">Add Carousel Item</h2>
        <div className="form-row">
          <div className="field">
            <label>Title <span className="req">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter title" />
          </div>
          <div className="field">
            <label>Subtitle</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Enter subtitle" />
          </div>
        </div>
        <div className="field full">
          <label>Banner Image URL <span className="req">*</span></label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/banner.jpg" />
        </div>
        <div className="field half">
          <label>Link to Content (Optional)</label>
          <div className="select-wrap">
            <select value={form.linkContent} onChange={(e) => setForm({ ...form, linkContent: e.target.value })}>
              <option value="No Link">No Link</option>
              <option value="Movies">Movies</option>
              <option value="Music">Music</option>
            </select>
            <svg className="sel-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        {errMsg ? <p className="err-msg">{errMsg}</p> : null}
        <button className="btn-add" onClick={addItem} disabled={saving || !form.title || !form.imageUrl}>
          {saving ? 'Adding...' : 'Add Item'}
        </button>
      </div>

      <div className="items-list">
        {carousel.map((item) => (
          <div key={item.key} className="carousel-row">
            <div className="ci-thumb">
              {item.imageUrl ? (
                <img src={toDisplayImage(item.imageUrl)} alt="" className="ci-img" onError={onImgErr} />
              ) : (
                <div className="ci-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                </div>
              )}
            </div>
            <div className="ci-info">
              <p className="ci-title">{item.title}</p>
              {item.subtitle ? <p className="ci-sub">{item.subtitle}</p> : null}
              <p className="ci-link">→ {item.linkContent}</p>
            </div>
            <div className="ci-actions">
              <button className="ci-btn-edit" onClick={() => startEdit(item)} title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              {pendingDelete === item.key ? (
                <>
                  <button className="ci-btn-delete confirming" onClick={() => deleteItem(item.key)} title="Confirm delete">Sure?</button>
                  <button className="ci-btn-cancel" onClick={() => setPendingDelete(null)} title="Cancel">✕</button>
                </>
              ) : (
                <button className="ci-btn-delete" onClick={() => setPendingDelete(item.key)} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {carousel.length === 0 ? <div className="empty">No carousel items yet.</div> : null}
      </div>

      {editData ? (
        <div
          className="modal-overlay vjs-AdminCarouselTab"
          onClick={(e) => { if (e.target === e.currentTarget) setEditData(null); }}
        >
          <div className="modal">
            <h3 className="modal-title">Edit Carousel Item</h3>
            <div className="field"><label>Title</label><input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} /></div>
            <div className="field"><label>Subtitle</label><input value={editData.subtitle || ''} onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })} /></div>
            <div className="field"><label>Banner Image URL</label><input value={editData.imageUrl} onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })} /></div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditData(null)}>Cancel</button>
              <button className="btn-add sm" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
