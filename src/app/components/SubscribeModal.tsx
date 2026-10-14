import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { doc, collection, addDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../store/auth'
import { activateSubscription, isSubscribed, userSubscription, subLoading } from '../store/subscription'
import { dbSubscriptionPlans } from '../store/db'
import { useV } from '../reactive'
import {
  pesapalGetToken,
  pesapalRegisterIPN,
  pesapalSubmitOrder,
  pesapalGetStatus,
} from '../lib/pesapal'
import './SubscribeModal.css'
import { subscribeMovie } from '../store/ui'

interface ModalPlan {
  id: string; name: string; duration: string; price: number; days: number; popular: boolean
}

const FALLBACK_PLANS: ModalPlan[] = [
  { id: '2days',  name: '2 Day Pass',  duration: '2 Days',  price: 5000,  days: 2,  popular: false },
  { id: '1week',  name: '1 Week Pass', duration: '1 Week',  price: 10000, days: 7,  popular: true  },
  { id: '1month', name: '1 Month Pass', duration: '1 Month', price: 30000, days: 30, popular: false },
]

function fmtDuration(days: number): string {
  if (days === 1) return '1 Day'
  if (days < 7) return `${days} Days`
  if (days === 7) return '1 Week'
  if (days === 14) return '2 Weeks'
  if (days >= 30 && days < 60) return '1 Month'
  if (days >= 60 && days < 90) return '2 Months'
  if (days >= 365) return `${Math.round(days / 365)} Year`
  return `${days} Days`
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+256')) return cleaned
  if (cleaned.startsWith('256')) return '+' + cleaned
  if (cleaned.startsWith('0')) return '+256' + cleaned.slice(1)
  return '+256' + cleaned
}

type Step = 'active' | 'plans' | 'phone' | 'paying' | 'success' | 'failed'

export interface SubscribeModalProps {
  open: boolean
  onClose: () => void
}

export default function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const { currentUser } = useAuth()
  const plansDb = useV(() => dbSubscriptionPlans.value)
  const activeSub = useV(() => userSubscription.value)
  const subscribed = useV(() => isSubscribed.value)
  const loadingSub = useV(() => subLoading.value)
  const user = useV(() => currentUser.value)

  const [step, setStep] = useState<Step>('plans')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [iframeUrl, setIframeUrl] = useState('')
  const [iframeLoading, setIframeLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const authToken = useRef('')
  const trackingId = useRef('')

  const movieTarget = useV(() => subscribeMovie.value)
  const PLANS: ModalPlan[] = [
    ...(movieTarget ? [{ id: 'movie:' + movieTarget.id, name: movieTarget.title, duration: 'This title only', price: 10000, days: 0, popular: false }] : []),
    { id: 'all', name: 'All Access', duration: 'All movies & series · 30 Days', price: 50000, days: 30, popular: true },
  ]

  const activePlan = PLANS.find(p => p.id === selectedPlanId)

  const subEndsAt = (() => {
    const end = activeSub?.endDate
    if (!end) return ''
    return new Date(end).toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' })
  })()

  function stopPolling() {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null }
  }

  function resetToPlans() {
    setStep('plans')
    setPhoneInput('')
    setIframeUrl('')
    setIframeLoading(false)
    setErrMsg('')
    authToken.current = ''
    trackingId.current = ''
  }

  useEffect(() => {
    if (!open) { stopPolling(); resetToPlans(); return }
    if (!open) return
    if (!loadingSub && subscribed && !subscribeMovie.value) { setStep('active'); return }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // If sub resolves to subscribed while modal already open and loading
  useEffect(() => {
    if (open && !loadingSub && subscribed && !subscribeMovie.value && step === 'plans') {
      setStep('active')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingSub, subscribed])

  useEffect(() => () => stopPolling(), [])

  function pickPlan(id: string) {
    setSelectedPlanId(id)
    setStep('phone')
    setErrMsg('')
  }

  function maybeClose() {
    if (step === 'paying') return
    onClose()
  }

  function goBackFromPaying() {
    stopPolling()
    setIframeUrl('')
    setIframeLoading(false)
    setStep('phone')
  }

  function retry() {
    stopPolling()
    setStep('phone')
    setErrMsg('')
    setIframeUrl('')
  }

  function startPolling(token: string, tId: string, userId: string, plan: ModalPlan) {
    stopPolling()
    let attempts = 0
    let fetching = false
    pollTimer.current = setInterval(async () => {
      if (fetching) return
      attempts++
      if (attempts > 200) { stopPolling(); return }

      fetching = true
      try {
        const status = await pesapalGetStatus(token, tId)
        if (!status) return

        if (status.statusCode === 1) {
          stopPolling()
          await activateSubscription(userId, plan, tId, status)
          localStorage.removeItem('pendingSubscription')
          setStep('success')
          setTimeout(() => onClose(), 2000)
        } else if (status.statusCode === 2 || status.statusCode === 3) {
          stopPolling()
          localStorage.removeItem('pendingSubscription')
          setErrMsg(status.statusCode === 3 ? 'Payment was reversed.' : 'Payment failed. Please try again.')
          setStep('failed')
        }
      } catch { /* network hiccup, keep polling */ } finally {
        fetching = false
      }
    }, 1500)
  }

  async function startPayment() {
    if (!phoneInput.trim() || !activePlan) return
    const plan = activePlan
    if (!user) return

    setStep('paying')
    setIframeLoading(true)
    setIframeUrl('')
    setErrMsg('')

    const normalizedPhone = normalizePhone(phoneInput.trim())

    try {
      const token = await pesapalGetToken()
      authToken.current = token

      const origin = window.location.origin
      const ipnUrl = `${origin}/api/pesapal-ipn`
      const ipnId = await pesapalRegisterIPN(token, ipnUrl)

      const order = await pesapalSubmitOrder(token, ipnId, {
        amount: plan.price,
        description: `LUO NIGER - ${plan.name}`,
        email: user.email || '',
        phone: phoneInput.trim(),
        firstName: user.displayName?.split(' ')[0] || 'Customer',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        callbackUrl: `${origin}/?pp_done=1`,
        cancellationUrl: `${origin}/`,
      })

      trackingId.current = order.orderTrackingId

      localStorage.setItem('pendingSubscription', JSON.stringify({
        orderTrackingId: order.orderTrackingId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        days: plan.days,
        userId: user.uid,
      }))

      void setDoc(doc(db, 'users', user.uid), { phone: normalizedPhone }, { merge: true })
        .catch((error) => console.error('[PesaPal] Could not save the customer phone after order creation.', error))

      void addDoc(collection(db, 'paymentLogs'), {
        userId: user.uid,
        email: user.email || '',
        phone: normalizedPhone,
        planName: plan.name,
        planId: plan.id,
        amount: plan.price,
        orderTrackingId: order.orderTrackingId,
        merchantReference: order.merchantReference,
        paymentMethod: 'PesaPal',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }).catch((error) => console.error('[PesaPal] Could not save the payment log after order creation.', error))

      void setDoc(doc(db, 'pendingOrders', order.orderTrackingId), {
        userId: user.uid,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        days: plan.days,
        merchantReference: order.merchantReference,
        createdAt: new Date().toISOString(),
      }).catch((error) => console.error('[PesaPal] Could not save the pending order after order creation.', error))

      setIframeUrl(order.redirectUrl)
      setIframeLoading(false)
      startPolling(token, order.orderTrackingId, user.uid, plan)

    } catch (e: any) {
      setIframeLoading(false)
      setErrMsg(e.message || 'Something went wrong. Please try again.')
      setStep('failed')
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className={`vjs-SubscribeModal modal-backdrop${step === 'paying' ? ' modal-backdrop--paying' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) maybeClose() }}
    >
      <div className={`modal-box${step === 'paying' ? ' modal-box--paying' : ''}`}>
        {step !== 'paying' && (
          <button className="modal-close" onClick={maybeClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}

        {step === 'active' && (
          <div className="center-state">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d9a3" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="hdr-title mt-3">You're Subscribed!</h2>
            <p className="center-sub mt-1">Your subscription is active.</p>
            <div className="active-sub-box">
              <div className="active-sub-row">
                <span className="active-sub-label">Plan</span>
                <span className="active-sub-val">{activeSub?.planName || activeSub?.planId || '—'}</span>
              </div>
              <div className="active-sub-row">
                <span className="active-sub-label">Expires</span>
                <span className="active-sub-val">{subEndsAt || '—'}</span>
              </div>
            </div>
            <button className="pay-btn mt-4" onClick={onClose}>CONTINUE WATCHING</button>
          </div>
        )}

        {step === 'plans' && (
          <>
            <div className="modal-header-row">
              <img src="/logo.png" alt="" className="hdr-logo" />
              <div>
                <h2 className="hdr-title">Subscribe to Download</h2>
                <p className="hdr-sub">Unlimited HD downloads · Powered by PesaPal</p>
              </div>
            </div>
            <div className="plan-grid">
              {PLANS.map(plan => (
                <div key={plan.id} className={`plan-card${plan.popular ? ' popular' : ''}`}>
                  {plan.popular && <div className="popular-badge">POPULAR</div>}
                  <p className="plan-name">{plan.name}</p>
                  <div className="plan-price-row">
                    <span className="plan-price">{plan.price.toLocaleString()}</span>
                    <span className="plan-ugx">UGX</span>
                  </div>
                  <p className="plan-period">{plan.duration}</p>
                  <p className="plan-feature">Unlimited Downloads</p>
                  <button className="plan-sub-btn" onClick={() => pickPlan(plan.id)}>Subscribe to Download</button>
                </div>
              ))}
            </div>
            <p className="footer-note">Secure payment via PesaPal · MTN / Airtel / Visa</p>
          </>
        )}

        {step === 'phone' && (
          <>
            <button className="back-btn" onClick={() => setStep('plans')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div className="pay-header">
              <h2 className="hdr-title">{activePlan?.name}</h2>
              <p className="hdr-sub">{activePlan?.price.toLocaleString()} UGX · {activePlan?.duration}</p>
            </div>
            <div className="field">
              <label className="field-label">Phone number</label>
              <input
                className="field-input"
                placeholder="e.g. 0771234567"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyUp={(e) => { if (e.key === 'Enter') startPayment() }}
              />
            </div>
            {errMsg && <p className="err-msg">{errMsg}</p>}
            <button className="pay-btn" disabled={!phoneInput.trim()} onClick={startPayment}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              PROCEED TO PAYMENT
            </button>
            <p className="footer-note">You'll be taken to a secure PesaPal payment page</p>
          </>
        )}

        {step === 'paying' && (
          <>
            <div className="pp-header">
              <button className="pp-back-btn" onClick={goBackFromPaying}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <div className="pp-secure-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secure Payment
              </div>
            </div>
            {iframeLoading ? (
              <div className="iframe-preparing">
                <div className="spinner"></div>
                <p className="iframe-prep-text">Connecting to PesaPal…</p>
              </div>
            ) : iframeUrl ? (
              <iframe
                src={iframeUrl}
                className="pay-iframe"
                frameBorder="0"
                allow="payment"
                scrolling="yes"
              ></iframe>
            ) : null}
            <div className="pp-status-bar">
              <div className="pp-waiting">
                <div className="pulse-dot"></div>
                {iframeLoading ? 'Preparing payment…' : 'Waiting for payment…'}
              </div>
              <div className="pp-plan-label">{activePlan?.name}</div>
              <div className="pp-amount">UGX {activePlan?.price.toLocaleString()}</div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="center-state">
            <div className="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d9a3" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="hdr-title mt-3">Payment Successful!</h2>
            <p className="center-sub mt-1">Your subscription is now active. Enjoy unlimited downloads!</p>
            <button className="pay-btn mt-4" onClick={onClose}>START DOWNLOADING</button>
          </div>
        )}

        {step === 'failed' && (
          <div className="center-state">
            <div className="fail-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </div>
            <h2 className="hdr-title mt-3">Payment Failed</h2>
            <p className="center-sub mt-1">{errMsg || 'The payment was not completed. Please try again.'}</p>
            <button className="pay-btn pay-btn--retry mt-4" onClick={retry}>TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
