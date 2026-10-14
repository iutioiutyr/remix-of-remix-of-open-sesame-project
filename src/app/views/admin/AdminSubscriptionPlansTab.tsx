import { useState } from 'react'
import { useV } from '../../reactive'
import {
  dbSubscriptionPlans,
  addSubscriptionPlan,
  updateSubscriptionPlan,
  removeSubscriptionPlan,
  type SubscriptionPlan,
} from '../../store/db'
import './AdminSubscriptionPlansTab.css'

const loading = false

function formatDuration(days: number): string {
  if (days === 1) return '1 DAY'
  if (days < 7) return `${days} DAYS`
  if (days === 7) return '1 WEEK'
  if (days === 14) return '2 WEEKS'
  if (days >= 30 && days < 60) return '1 MONTH'
  if (days >= 60 && days < 90) return '2 MONTHS'
  if (days >= 365) return `${Math.round(days / 365)} YEAR`
  return `${days} DAYS`
}

export default function AdminSubscriptionPlansTab() {
  const plans = useV(() => dbSubscriptionPlans.value)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null)
  const [form, setForm] = useState({ name: '', price: 0, durationDays: 1 })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', price: 0, durationDays: 1 })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan)
    setForm({ name: plan.name, price: plan.price, durationDays: plan.durationDays })
    setFormError('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setFormError('')
  }

  async function savePlan() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Plan name is required.'); return }
    if (form.price < 0) { setFormError('Price must be 0 or more.'); return }
    if (!form.durationDays || form.durationDays < 1) { setFormError('Duration must be at least 1 day.'); return }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: form.price,
        durationDays: form.durationDays,
      }
      if (editing) {
        await updateSubscriptionPlan(editing.key, payload)
        showToast('✓ Plan updated')
      } else {
        await addSubscriptionPlan(payload)
        showToast('✓ Plan added')
      }
      closeModal()
    } catch (e: any) {
      setFormError(e?.message || 'Failed to save plan.')
    }
    setSaving(false)
  }

  function confirmDelete(plan: SubscriptionPlan) {
    setDeleteTarget(plan)
  }

  async function doDelete() {
    if (!deleteTarget) return
    setDeleting(deleteTarget.key)
    try {
      await removeSubscriptionPlan(deleteTarget.key)
      showToast('Plan deleted')
      setDeleteTarget(null)
    } catch (e: any) {
      showToast(`Error: ${e?.message || 'Failed to delete'}`)
    }
    setDeleting(null)
  }

  return (
    <div className="tab-page vjs-AdminSubscriptionPlansTab">
      <div className="tab-header">
        <div className="header-left">
          <h1 className="tab-title">Subscription Plans</h1>
          <p className="tab-sub">Plans defined here appear as buttons when activating users</p>
        </div>
        <button className="add-btn" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Plan
        </button>
      </div>

      {loading ? (
        <div className="state-box">
          <div className="spin-ring"></div>
          <p className="state-text">Loading plans…</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="state-box">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
          <p className="state-text">No subscription plans yet.</p>
          <p className="state-sub">Click "Add Plan" to create your first plan.</p>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map(plan => (
            <div key={plan.key} className="plan-card">
              <div className="plan-badge">{formatDuration(plan.durationDays)}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                <span className="price-currency">UGX</span>
                <span className="price-amount">{plan.price.toLocaleString()}</span>
              </div>
              <div className="plan-meta">{plan.durationDays} day{plan.durationDays !== 1 ? 's' : ''} access</div>
              <div className="plan-actions">
                <button className="btn-edit" onClick={() => openEdit(plan)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => confirmDelete(plan)} disabled={deleting === plan.key}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Plan' : 'New Subscription Plan'}</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label className="field-label">Plan Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="field-input"
                  placeholder="e.g. 1 Week Pass"
                  maxLength={60}
                />
                <span className="field-hint">Shown to users and in activation buttons</span>
              </div>
              <div className="field-row">
                <div className="field">
                  <label className="field-label">Price (UGX)</label>
                  <input
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    type="number"
                    min={0}
                    className="field-input"
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Duration (days)</label>
                  <input
                    value={form.durationDays}
                    onChange={e => setForm(f => ({ ...f, durationDays: Number(e.target.value) }))}
                    type="number"
                    min={1}
                    className="field-input"
                    placeholder="e.g. 7"
                  />
                </div>
              </div>

              {(form.durationDays > 0 || form.price > 0) && (
                <div className="preview-box">
                  <span className="preview-label">Preview</span>
                  <span className="preview-pill">{form.name || 'Plan Name'}</span>
                  <span className="preview-detail">UGX {(form.price || 0).toLocaleString()} · {form.durationDays || 0} day{form.durationDays !== 1 ? 's' : ''}</span>
                </div>
              )}

              {formError && <p className="form-error">{formError}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-save" onClick={savePlan} disabled={saving}>
                {saving && <span className="btn-spin"></span>}
                {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Plan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Delete Plan</h2>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                This won't affect existing user subscriptions.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={doDelete} disabled={!!deleting}>
                {deleting && <span className="btn-spin"></span>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
