import { useState } from 'react';
import './AdminHeroSlidesTab.css';

interface HeroSlide {
  id: number;
  title: string;
  type: string;
  bg: string;
  accent: string;
}

const presets = [
  { name: 'Ocean', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #0d2a4a 0%, #071220 60%, #050c08 100%)', accent: '#4db8ff' },
  { name: 'Gold', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #1a1a08 0%, #100f06 60%, #050c08 100%)', accent: '#4dd0ff' },
  { name: 'Purple', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #1a0a3a 0%, #0f0620 60%, #050c08 100%)', accent: '#00e0b0' },
  { name: 'Forest', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #0a1f0a 0%, #071207 60%, #050c08 100%)', accent: '#7aff5c' },
  { name: 'Red', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #2a0a0a 0%, #180606 60%, #050c08 100%)', accent: '#ff6b6b' },
  { name: 'Teal', bg: 'radial-gradient(ellipse 120% 100% at 80% 20%, #002a2a 0%, #001515 60%, #050c08 100%)', accent: '#00ffcc' },
];

export default function AdminHeroSlidesTab() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [nextSlideId, setNextSlideId] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', bg: '', accent: '#4db8ff' });

  function applyPreset(p: { bg: string; accent: string }) {
    setForm((f) => ({ ...f, bg: p.bg, accent: p.accent }));
  }

  function resetForm() {
    setForm({ title: '', type: '', bg: '', accent: '#4db8ff' });
    setSaved(false);
  }

  function addSlide() {
    const id = nextSlideId;
    setNextSlideId(id + 1);
    setHeroSlides((s) => [...s, { id, title: form.title, type: form.type, bg: form.bg, accent: form.accent }]);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
      resetForm();
    }, 1500);
  }

  function deleteSlide(id: number) {
    setHeroSlides((s) => s.filter((sl) => sl.id !== id));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setHeroSlides((s) => {
      const slides = [...s];
      [slides[idx - 1], slides[idx]] = [slides[idx], slides[idx - 1]];
      return slides;
    });
  }

  function moveDown(idx: number) {
    setHeroSlides((s) => {
      if (idx >= s.length - 1) return s;
      const slides = [...s];
      [slides[idx + 1], slides[idx]] = [slides[idx], slides[idx + 1]];
      return slides;
    });
  }

  return (
    <div className="tab-page vjs-AdminHeroSlidesTab">
      <div className="tab-header">
        <div>
          <h1 className="tab-title">Hero Slides</h1>
          <p className="tab-sub">{heroSlides.length} slides active on homepage</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <span>+</span> Add Slide
        </button>
      </div>

      {showForm ? (
        <div className="form-card">
          <h2 className="form-title">Add Hero Slide</h2>
          <div className="form-grid">
            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Movie or show title" />
            </div>
            <div className="field">
              <label>Type Label *</label>
              <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="ACTION  •  THRILLER" />
            </div>
            <div className="field">
              <label>Accent Color</label>
              <div className="color-row">
                <input value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} placeholder="#00d9a3" className="color-text" />
                <input value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} type="color" className="color-picker" />
              </div>
            </div>
            <div className="field">
              <label>Preview</label>
              <div className="slide-preview" style={{ background: form.bg || '#111' }}>
                <p className="prev-type" style={{ color: form.accent || '#00d9a3' }}>{form.type || 'TYPE'}</p>
                <p className="prev-title">{form.title || 'Title'}</p>
              </div>
            </div>
            <div className="field col-2">
              <label>Background CSS Gradient *</label>
              <input value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} placeholder="radial-gradient(ellipse 120% 100% at 80% 20%, #0d2a4a 0%, #071220 60%, #050c08 100%)" />
              <p className="field-hint">Paste a CSS gradient, or use one of the presets below:</p>
              <div className="preset-row">
                {presets.map((p) => (
                  <button key={p.name} onClick={() => applyPreset(p)} className="preset-btn" style={{ background: p.bg }}>{p.name}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
            <button className="btn-primary" onClick={addSlide} disabled={!form.title || !form.bg}>Add Slide</button>
          </div>
          {saved ? <p className="save-msg">✓ Slide added to homepage</p> : null}
        </div>
      ) : null}

      <div className="slides-grid">
        {heroSlides.map((slide, idx) => (
          <div key={slide.id} className="slide-card">
            <div className="slide-bg" style={{ background: slide.bg }}>
              <div className="slide-overlay"></div>
              <div className="slide-content">
                <p className="slide-type" style={{ color: slide.accent }}>{slide.type}</p>
                <p className="slide-title">{slide.title}</p>
              </div>
              <div className="slide-num">#{idx + 1}</div>
            </div>
            <div className="slide-footer">
              <div className="slide-actions">
                <button className="btn-move" onClick={() => moveUp(idx)} disabled={idx === 0} title="Move up">↑</button>
                <button className="btn-move" onClick={() => moveDown(idx)} disabled={idx === heroSlides.length - 1} title="Move down">↓</button>
                <button className="btn-danger-sm" onClick={() => deleteSlide(slide.id)}>Remove</button>
              </div>
              <div className="accent-dot" style={{ background: slide.accent }} title={slide.accent}></div>
            </div>
          </div>
        ))}
        {heroSlides.length === 0 ? <div className="empty-slides">No slides added yet.</div> : null}
      </div>
    </div>
  );
}
