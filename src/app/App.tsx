import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { doc, deleteDoc } from 'firebase/firestore'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import LoginModal from './components/LoginModal'
import SubscribeModal from './components/SubscribeModal'
import { loginOpen, subscribeOpen, toastMsg, toastType, showToast } from './store/ui'
import { pesapalGetToken, pesapalGetStatus } from './lib/pesapal'
import { activateSubscription, userSubscription, subLoading } from './store/subscription'
import { currentUser } from './store/auth'
import { db } from './lib/firebase'
import { useV } from './reactive'
import './App.css'
import './VisualRefresh.css'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminRoute = location.pathname.startsWith('/admin')

  const loginOpenV = useV(() => loginOpen.value)
  const subscribeOpenV = useV(() => subscribeOpen.value)
  const toastMsgV = useV(() => toastMsg.value)
  const toastTypeV = useV(() => toastType.value)

  // ── Shared: activate a pending order and clean up ────────────────────────
  async function activatePendingOrder(
    pending: { orderTrackingId: string; planId: string; planName: string; amount: number; days: number; userId: string },
    status: { statusCode: number; paymentMethod: string; confirmationCode: string; paymentAccount: string; amount: number }
  ) {
    localStorage.removeItem('pendingSubscription')
    await activateSubscription(
      pending.userId,
      { id: pending.planId, name: pending.planName, price: pending.amount, days: pending.days },
      pending.orderTrackingId,
      status
    )
    // Clean up Firebase pendingOrders node so other sessions won't re-process
    try { await deleteDoc(doc(db, 'pendingOrders', pending.orderTrackingId)) } catch { /* ok */ }
  }

  // ── Guard: is this order already activated in Firebase? ───────────────────
  function isAlreadyActivated(orderTrackingId: string): boolean {
    const sub = userSubscription.value
    return !!(sub && sub.orderTrackingId === orderTrackingId)
  }

  // ── Wait helpers ─────────────────────────────────────────────────────────
  function waitForAuth(maxMs = 8000): Promise<void> {
    return new Promise((resolve) => {
      if (currentUser.value) return resolve()
      const timer = setInterval(() => { if (currentUser.value) { clearInterval(timer); resolve() } }, 200)
      setTimeout(() => { clearInterval(timer); resolve() }, maxMs)
    })
  }

  function waitForSubLoaded(maxMs = 5000): Promise<void> {
    return new Promise((resolve) => {
      if (!subLoading.value) return resolve()
      const timer = setInterval(() => { if (!subLoading.value) { clearInterval(timer); resolve() } }, 200)
      setTimeout(() => { clearInterval(timer); resolve() }, maxMs)
    })
  }

  // ── Handle PesaPal callback redirect (?pp_done=1) ────────────────────────
  async function handlePpDoneCallback() {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('pp_done')) return false

    // Clean URL immediately so refresh doesn't re-trigger
    navigate({ to: '/', search: {} as any, replace: true })

    const raw = localStorage.getItem('pendingSubscription')
    if (!raw) return true // URL handled but nothing to activate

    let pending: any
    try { pending = JSON.parse(raw) } catch { localStorage.removeItem('pendingSubscription'); return true }

    const { orderTrackingId, planId, planName, amount, days, userId } = pending
    if (!orderTrackingId) { localStorage.removeItem('pendingSubscription'); return true }

    await waitForAuth()
    await waitForSubLoaded()

    // Guard: already activated for this exact order
    if (isAlreadyActivated(orderTrackingId)) {
      localStorage.removeItem('pendingSubscription')
      return true
    }

    // Poll until confirmed (max 30 × 2s = 60s)
    let attempts = 0
    const check = async (): Promise<void> => {
      attempts++
      try {
        const token = await pesapalGetToken()

        if (isAlreadyActivated(orderTrackingId)) { localStorage.removeItem('pendingSubscription'); return }

        const status = await pesapalGetStatus(token, orderTrackingId)
        if (status?.statusCode === 1) {
          const uid = userId || currentUser.value?.uid
          if (!uid) return
          await activatePendingOrder({ orderTrackingId, planId, planName, amount, days, userId: uid }, status)
          showToast('Payment confirmed! Your subscription is now active.')
        } else if (status && (status.statusCode === 2 || status.statusCode === 3)) {
          localStorage.removeItem('pendingSubscription')
        } else if (attempts < 30) {
          setTimeout(check, 2000)
        }
      } catch { if (attempts < 30) setTimeout(check, 3000) }
    }
    await check()
    return true
  }

  // ── Background checker: runs silently on every load (not ?pp_done) ───────
  async function checkPendingPaymentSilently() {
    const raw = localStorage.getItem('pendingSubscription')
    if (!raw) return

    let pending: any
    try { pending = JSON.parse(raw) } catch { localStorage.removeItem('pendingSubscription'); return }

    const { orderTrackingId, planId, planName, amount, days, userId } = pending
    if (!orderTrackingId || !userId) { localStorage.removeItem('pendingSubscription'); return }

    // Wait for auth
    await waitForAuth(10000)

    // Must be the same user who initiated this payment
    if (!currentUser.value || currentUser.value.uid !== userId) return

    // Wait for subscription data from Firebase
    await waitForSubLoaded(6000)

    // Guard: this exact order already activated → just clean up
    if (isAlreadyActivated(orderTrackingId)) {
      localStorage.removeItem('pendingSubscription')
      return
    }

    // Silent background polling: every 5s, up to 36 attempts (~3 min total)
    let attempts = 0
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      attempts++
      if (attempts > 36) {
        // Timed out waiting — remove stale pending (payment took too long or truly failed)
        localStorage.removeItem('pendingSubscription')
        return
      }

      try {
        // Re-check guard before each API call (another tab / session may have activated)
        if (isAlreadyActivated(orderTrackingId)) {
          localStorage.removeItem('pendingSubscription')
          cancelled = true
          return
        }

        const token = await pesapalGetToken()

        const status = await pesapalGetStatus(token, orderTrackingId)
        if (!status) { setTimeout(poll, 6000); return }

        if (status.statusCode === 1) {
          // Payment was successful — activate silently
          cancelled = true
          await activatePendingOrder({ orderTrackingId, planId, planName, amount, days, userId }, status)
          showToast('Payment confirmed! Your subscription is now active.')
        } else if (status.statusCode === 2 || status.statusCode === 3) {
          // Payment definitively failed or reversed
          cancelled = true
          localStorage.removeItem('pendingSubscription')
        } else {
          // Still pending (statusCode 0 or -1) — keep checking
          setTimeout(poll, 5000)
        }
      } catch {
        // Network hiccup — back off and try again
        if (!cancelled) setTimeout(poll, 8000)
      }
    }

    // Short initial delay so the page fully loads before hitting PesaPal API
    setTimeout(poll, 4000)
  }

  useEffect(() => {
    // ── Global right-click + DevTools protection ──────────────
    const onContextMenu = (e: MouseEvent) => {
      if (!location.pathname.startsWith('/admin')) e.preventDefault()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (ctrl && e.key.toUpperCase() === 'U')
      ) { e.preventDefault(); e.stopPropagation() }
    }
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown, true)

    ;(async () => {
      // Handle ?pp_done=1 callback first (PesaPal redirect after payment)
      const wasPpDone = await handlePpDoneCallback()

      // Only run background checker if this is NOT a PesaPal redirect
      if (!wasPpDone) {
        checkPendingPaymentSilently() // intentionally not awaited — runs in background
      }
    })()

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div id="app" className="min-h-screen w-full flex flex-col">
      {!isAdminRoute && <AppHeader />}
      <div className="flex-1 pb-mobile-nav lg:pb-0">
        <Outlet />
      </div>
      {!isAdminRoute && <AppFooter />}

      {!isAdminRoute && (
        <LoginModal
          open={loginOpenV}
          onClose={() => { loginOpen.value = false }}
          onLoggedIn={() => { loginOpen.value = false }}
        />
      )}
      {!isAdminRoute && (
        <SubscribeModal open={subscribeOpenV} onClose={() => { subscribeOpen.value = false }} />
      )}

      {/* Silent payment activation toast */}
      {toastMsgV && (
        <div className={`pay-toast-bar ${toastTypeV}`}>
          {toastTypeV === 'success' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          )}
          <span>{toastMsgV}</span>
        </div>
      )}
    </div>
  )
}
