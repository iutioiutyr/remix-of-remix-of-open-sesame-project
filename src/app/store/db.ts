import { ref, computed } from '@vue/reactivity'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Movie, FbEpisode } from '../data/movies'

export type { FbEpisode }

export type SubDuration = '1-Day' | '2-Days' | '1-Week' | '2-Weeks' | '1-Month'

export interface AdminMovie {
  key: string
  title: string
  image: string
  streamlink: string
  category: string
  rating: number
  year: number
  isTrending: boolean
  createdAt: string
}

export interface AdminSeries {
  key: string
  title: string
  image: string
  category: string
  rating: number
  year: number
  createdAt: string
  episodes: FbEpisode[]
}

export interface AdminAnimation {
  key: string
  title: string
  image: string
  streamlink: string
  category: string
  rating: number
  year: number
  isTrending: boolean
  createdAt: string
}

export interface AdminCarousel {
  key: string
  title: string
  subtitle: string
  imageUrl: string
  linkContent: string
  createdAt?: string
  order?: number
}

export interface AdminSubscription {
  planId: string
  planName: string
  startDate: string
  endDate: string
  active: boolean
}

export interface AdminUser {
  uid: string
  name: string
  email: string
  joinedAt: string
  lastLogin?: string
  subscription?: AdminSubscription | null
}

export interface AdminTransaction {
  key: string
  userId: string
  userName: string
  phone: string
  email: string
  plan: string
  amount: number
  method: string
  status: 'Successful' | 'Failed' | 'Pending'
  createdAt: string
}

export interface SubscriptionPlan {
  key: string
  name: string
  price: number       // price in UGX
  durationDays: number
  createdAt?: string
}

export const dbMovies = ref<AdminMovie[]>([])
export const dbSeries = ref<AdminSeries[]>([])
export const dbAnimation = ref<AdminAnimation[]>([])
export const dbCarousel = ref<AdminCarousel[]>([])
export const dbUsers = ref<AdminUser[]>([])
export const dbTransactions = ref<AdminTransaction[]>([])
export const dbSubscriptionPlans = ref<SubscriptionPlan[]>([])
export const dbLoading = ref(true)

// Track which of the 5 content listeners have resolved
const firedFlags = { movies: false, series: false, animation: false, carousel: false, paymentLogs: false }
function checkLoaded(key: keyof typeof firedFlags) {
  firedFlags[key] = true
  if (Object.values(firedFlags).every(Boolean)) {
    dbLoading.value = false
  }
}
// Safety timeout: never leave the user on a loading screen
setTimeout(() => { dbLoading.value = false }, 8000)

// Handles both Firestore Timestamp objects and plain date strings
function toDateStr(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val?.toDate) return val.toDate().toISOString()
  if (val?.seconds) return new Date(val.seconds * 1000).toISOString()
  return String(val)
}

function normalizeStatus(status: string | undefined): 'Successful' | 'Failed' | 'Pending' {
  if (!status) return 'Pending'
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'successful' || s === 'success') return 'Successful'
  if (s === 'failed' || s === 'fail' || s === 'reversed') return 'Failed'
  return 'Pending'
}

// ─── Movies ────────────────────────────────────────────────────────────────
onSnapshot(collection(db, 'movies'), (snap) => {
  const list: AdminMovie[] = []
  snap.forEach((child) => {
    const d = child.data()
    list.push({
      key: child.id,
      title: d.title || '',
      image: d.poster_url || d.image || d.imageUrl || d.image_url || d.poster || d.thumbnail || d.coverImage || d.cover || '',
      streamlink: d.stream_url || d.streamlink || d.stream_link || d.url || d.videoUrl || '',
      category: d.category || '',
      rating: Number(d.rating) || 0,
      year: Number(d.year) || 0,
      isTrending: !!(d.is_trending || d.isTrending),
      createdAt: toDateStr(d.created_at || d.createdAt),
    })
  })
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  dbMovies.value = list
  checkLoaded('movies')
}, () => { checkLoaded('movies') })

// ─── Series ────────────────────────────────────────────────────────────────
onSnapshot(collection(db, 'series'), (snap) => {
  const list: AdminSeries[] = []
  snap.forEach((child) => {
    const d = child.data()
    let eps: FbEpisode[] = []
    if (d.episodes) {
      const raw = d.episodes
      const arr = Array.isArray(raw) ? raw : Object.values(raw)
      eps = arr.filter(Boolean).map((e: any, i: number) => ({
        episodeNumber: Number(e.episodeNumber) || i + 1,
        title: e.title || `Episode ${i + 1}`,
        streamlink: e.stream_url || e.streamlink || e.url || '',
      }))
    }
    list.push({
      key: child.id,
      title: d.title || '',
      image: d.poster_url || d.image || d.imageUrl || d.image_url || d.poster || d.thumbnail || d.coverImage || d.cover || '',
      category: d.category || '',
      rating: Number(d.rating) || 0,
      year: Number(d.year) || 0,
      createdAt: toDateStr(d.created_at || d.createdAt),
      episodes: eps,
    })
  })
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  dbSeries.value = list
  checkLoaded('series')
}, () => { checkLoaded('series') })

// ─── Animation ─────────────────────────────────────────────────────────────
onSnapshot(collection(db, 'animation'), (snap) => {
  const list: AdminAnimation[] = []
  snap.forEach((child) => {
    const d = child.data()
    list.push({
      key: child.id,
      title: d.title || '',
      image: d.poster_url || d.image || d.imageUrl || d.image_url || d.poster || d.thumbnail || d.coverImage || d.cover || '',
      streamlink: d.stream_url || d.streamlink || d.stream_link || d.url || d.videoUrl || '',
      category: d.category || 'Animation',
      rating: Number(d.rating) || 0,
      year: Number(d.year) || 0,
      isTrending: !!(d.is_trending || d.isTrending),
      createdAt: toDateStr(d.created_at || d.createdAt),
    })
  })
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  dbAnimation.value = list
  checkLoaded('animation')
}, () => { checkLoaded('animation') })

// ─── Carousel ──────────────────────────────────────────────────────────────
onSnapshot(collection(db, 'carousel'), (snap) => {
  const list: AdminCarousel[] = []
  snap.forEach((child) => {
    const d = child.data()
    list.push({
      key: child.id,
      title: d.title || '',
      subtitle: d.subtitle || '',
      imageUrl: d.banner_url || d.imageUrl || d.image || d.image_url || '',
      linkContent: d.link_id || d.linkContent || d.contentType || 'No Link',
      createdAt: toDateStr(d.created_at || d.createdAt),
      order: typeof d.order === 'number' ? d.order : 999,
    })
  })
  // Sort by explicit order field; fall back to newest-first by date
  list.sort((a, b) => (a as any).order - (b as any).order || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  dbCarousel.value = list
  checkLoaded('carousel')
}, () => { checkLoaded('carousel') })

// ─── Transactions (paymentLogs + subscriptions merged) ─────────────────────
let logsData: Record<string, any> | null = null
let subsData: Record<string, any> | null = null
let logsReady = false
let subsReady = false

function buildTransactions() {
  if (!logsReady || !subsReady) return
  const map: Record<string, AdminTransaction> = {}

  // 1. Payment logs are primary source
  if (logsData) {
    for (const [key, v] of Object.entries(logsData)) {
      const firstName = v.firstName || v.first_name || ''
      const lastName = v.lastName || v.last_name || ''
      const fullName = v.userName || v.displayName || (firstName || lastName ? `${firstName} ${lastName}`.trim() : '')
      map[key] = {
        key,
        userId: v.userId || '',
        userName: fullName,
        phone: v.phoneNumber || v.phone_number || v.phone || v.payment_account || '',
        email: v.email || '',
        plan: v.planName || v.plan || '',
        amount: Number(v.amount) || 0,
        method: v.paymentMethod || v.payment_method || v.method || '',
        status: normalizeStatus(v.status),
        createdAt: v.createdAt || v.created_at || '',
      }
    }
  }

  // 2. Subscriptions — add entries not already in paymentLogs
  if (subsData) {
    for (const [userId, v] of Object.entries(subsData)) {
      const trackingId = v.orderTrackingId || `sub-${userId}`
      if (!map[trackingId]) {
        const firstName = v.firstName || v.displayName || ''
        const lastName = v.lastName || ''
        const fullName = v.userName || (firstName || lastName ? `${firstName} ${lastName}`.trim() : '')
        map[trackingId] = {
          key: trackingId,
          userId,
          userName: fullName,
          phone: v.paymentPhone || v.phoneNumber || v.phone || '',
          email: v.email || '',
          plan: v.planName || v.planId || '',
          amount: Number(v.amount) || 0,
          method: v.paymentMethod || v.method || 'Admin Activation',
          status: 'Successful',
          createdAt: v.createdAt || v.startDate || '',
        }
      }
    }
  }

  dbTransactions.value = Object.values(map)
  checkLoaded('paymentLogs')
}

onSnapshot(collection(db, 'paymentLogs'), (snap) => {
  logsData = {}
  snap.forEach((child) => { logsData![child.id] = child.data() })
  logsReady = true
  buildTransactions()
}, () => { logsReady = true; buildTransactions() })

onSnapshot(collection(db, 'subscriptions'), (snap) => {
  subsData = {}
  snap.forEach((child) => { subsData![child.id] = child.data() })
  subsReady = true
  buildTransactions()

  // Also update user subscriptions reactively
  const subs: Record<string, AdminSubscription> = {}
  snap.forEach((child) => {
    const v = child.data()
    subs[child.id] = {
      planId: v.planId || '',
      planName: v.planName || v.planId || '',
      startDate: v.startDate || '',
      endDate: v.endDate || '',
      active: !!v.active,
    }
  })
  dbUsers.value = dbUsers.value.map((u) => ({ ...u, subscription: subs[u.uid] || null }))
}, () => { subsReady = true; buildTransactions() })

// ─── Users (with subscriptions merged) ────────────────────────────────────
let _usersUnsub: (() => void) | null = null
function registerUsersListener() {
  if (_usersUnsub) _usersUnsub()
  _usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
    const list: AdminUser[] = []
    snap.forEach((child) => {
      const d = child.data()
      const uid = child.id
      const name = d.name || d.displayName || d.email?.split('@')[0] || 'Unknown'
      const sub = subsData?.[uid] ?? null
      list.push({
        uid,
        name,
        email: d.email || '',
        joinedAt: d.joinedAt || d.createdAt?.slice(0, 10) || '',
        lastLogin: d.lastLogin,
        subscription: sub ? {
          planId: sub.planId || '',
          planName: sub.planName || sub.planId || '',
          startDate: sub.startDate || '',
          endDate: sub.endDate || '',
          active: !!sub.active,
        } : null,
      })
    })
    list.sort((a, b) => {
      const aActive = a.subscription?.active && new Date(a.subscription.endDate) > new Date()
      const bActive = b.subscription?.active && new Date(b.subscription.endDate) > new Date()
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      const da = new Date(a.lastLogin || a.joinedAt || 0).getTime()
      const db2 = new Date(b.lastLogin || b.joinedAt || 0).getTime()
      return db2 - da
    })
    dbUsers.value = list
  }, () => { dbUsers.value = [] })
}
registerUsersListener()

export function refreshUsersListener() { registerUsersListener() }

// ─── CRUD: Movies ───────────────────────────────────────────────────────────
export async function addMovie(data: Omit<AdminMovie, 'key'>) {
  return addDoc(collection(db, 'movies'), data)
}
export async function updateMovie(key: string, data: Partial<Omit<AdminMovie, 'key'>>) {
  return updateDoc(doc(db, 'movies', key), data)
}
export async function removeMovie(key: string) {
  return deleteDoc(doc(db, 'movies', key))
}

// ─── CRUD: Series ───────────────────────────────────────────────────────────
export async function addSeries(data: Omit<AdminSeries, 'key'>) {
  return addDoc(collection(db, 'series'), data)
}
export async function updateSeries(key: string, data: Partial<Omit<AdminSeries, 'key'>>) {
  return updateDoc(doc(db, 'series', key), data)
}
export async function removeSeries(key: string) {
  return deleteDoc(doc(db, 'series', key))
}

// ─── CRUD: Animation ────────────────────────────────────────────────────────
export async function addAnimation(data: Omit<AdminAnimation, 'key'>) {
  return addDoc(collection(db, 'animation'), data)
}
export async function updateAnimation(key: string, data: Partial<Omit<AdminAnimation, 'key'>>) {
  return updateDoc(doc(db, 'animation', key), data)
}
export async function removeAnimation(key: string) {
  return deleteDoc(doc(db, 'animation', key))
}

// ─── Subscription Plans ────────────────────────────────────────────────────
onSnapshot(collection(db, 'subscriptionPlans'), (snap) => {
  const list: SubscriptionPlan[] = []
  snap.forEach((child) => {
    const d = child.data()
    list.push({
      key: child.id,
      name: d.name || '',
      price: Number(d.price) || 0,
      durationDays: Number(d.durationDays) || 1,
      createdAt: toDateStr(d.createdAt),
    })
  })
  list.sort((a, b) => a.durationDays - b.durationDays)
  dbSubscriptionPlans.value = list
}, () => { dbSubscriptionPlans.value = [] })

export async function addSubscriptionPlan(data: Omit<SubscriptionPlan, 'key'>) {
  return addDoc(collection(db, 'subscriptionPlans'), { ...data, createdAt: new Date().toISOString() })
}
export async function updateSubscriptionPlan(key: string, data: Partial<Omit<SubscriptionPlan, 'key'>>) {
  return updateDoc(doc(db, 'subscriptionPlans', key), data)
}
export async function removeSubscriptionPlan(key: string) {
  return deleteDoc(doc(db, 'subscriptionPlans', key))
}

// ─── CRUD: Carousel ─────────────────────────────────────────────────────────
export async function addCarousel(data: Omit<AdminCarousel, 'key'>) {
  const { imageUrl, ...rest } = data as any
  return addDoc(collection(db, 'carousel'), { ...rest, imageUrl: imageUrl || '' })
}
export async function updateCarousel(key: string, data: Partial<Omit<AdminCarousel, 'key'>>) {
  return updateDoc(doc(db, 'carousel', key), data)
}
export async function removeCarousel(key: string) {
  return deleteDoc(doc(db, 'carousel', key))
}

// ─── CRUD: Transactions ──────────────────────────────────────────────────────
export async function removeTransaction(key: string) {
  // Try paymentLogs collection first; the key IS the document ID
  try {
    await deleteDoc(doc(db, 'paymentLogs', key))
  } catch (_) {}
}

// ─── User Subscription Management ────────────────────────────────────────────
const PLAN_DURATIONS: Record<SubDuration, number> = {
  '1-Day': 1, '2-Days': 2, '1-Week': 7, '2-Weeks': 14, '1-Month': 30,
}
const PLAN_NAMES: Record<SubDuration, string> = {
  '1-Day': '1 Day Pass', '2-Days': '2 Days Pass', '1-Week': '1 Week Pass',
  '2-Weeks': '2 Weeks Pass', '1-Month': '1 Month Pass',
}

export async function activateUser(uid: string, plan: SubDuration) {
  const now = new Date()
  const exp = new Date(now.getTime() + PLAN_DURATIONS[plan] * 86400000)
  const sub: AdminSubscription = {
    planId: plan,
    planName: PLAN_NAMES[plan],
    startDate: now.toISOString().slice(0, 10),
    endDate: exp.toISOString().slice(0, 10),
    active: true,
  }
  await setDoc(doc(db, 'subscriptions', uid), sub)
  await addDoc(collection(db, 'paymentLogs'), {
    userId: uid,
    userName: dbUsers.value.find(u => u.uid === uid)?.name || '',
    email: dbUsers.value.find(u => u.uid === uid)?.email || '',
    phone: '',
    plan: PLAN_NAMES[plan],
    planName: PLAN_NAMES[plan],
    amount: 0,
    method: 'Admin Activation',
    paymentMethod: 'Admin Activation',
    status: 'Successful',
    createdAt: now.toISOString().slice(0, 16).replace('T', ' '),
  })
}

export async function deactivateUser(uid: string) {
  return deleteDoc(doc(db, 'subscriptions', uid))
}

// ─── Public reactive content (for frontend views) ────────────────────────────
const BG_COLORS = [
  '#0d2035', '#1a0d2e', '#2a0d0d', '#0d1535', '#1a150d',
  '#0d0d20', '#200d0d', '#100d1a', '#0d1f15', '#200a0a',
  '#0a1f0a', '#1f0a1f', '#0a0a1f', '#1f1a0a',
]

function keyHash(key: string): number {
  return key.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
}

function toPublicMovie(m: AdminMovie, idx: number): Movie {
  const h = keyHash(m.key)
  return {
    id: idx,
    title: m.title,
    type: 'MOVIES',
    rating: m.rating,
    genres: m.category ? [m.category] : ['Action'],
    date: String(m.year || ''),
    color: BG_COLORS[h % BG_COLORS.length],
    image: m.image,
    streamlink: m.streamlink,
    isTrending: m.isTrending,
    category: m.category,
    year: m.year,
    createdAt: m.createdAt,
  }
}

function toPublicSeries(s: AdminSeries, idx: number): Movie {
  const h = keyHash(s.key)
  return {
    id: idx + 10000,
    title: s.title,
    type: 'TV SERIES',
    rating: s.rating,
    genres: s.category ? [s.category] : ['Drama'],
    date: String(s.year || ''),
    color: BG_COLORS[h % BG_COLORS.length],
    image: s.image,
    episodes: s.episodes,
    isTrending: false,
    category: s.category,
    year: s.year,
    createdAt: s.createdAt,
  }
}

function toPublicAnimation(a: AdminAnimation, idx: number): Movie {
  const h = keyHash(a.key)
  return {
    id: idx + 20000,
    title: a.title,
    type: 'ANIMATION',
    rating: a.rating,
    genres: a.category ? [a.category] : ['Animation'],
    date: String(a.year || ''),
    color: BG_COLORS[h % BG_COLORS.length],
    image: a.image,
    streamlink: a.streamlink,
    isTrending: a.isTrending,
    category: a.category,
    year: a.year,
    createdAt: a.createdAt,
  }
}

export const publicMovies = computed<Movie[]>(() => dbMovies.value.map(toPublicMovie))
export const publicSeries = computed<Movie[]>(() => dbSeries.value.map(toPublicSeries))
export const publicAnimation = computed<Movie[]>(() => dbAnimation.value.map(toPublicAnimation))
export const publicAll = computed<Movie[]>(() => {
  const all = [
    ...publicMovies.value,
    ...publicSeries.value,
    ...publicAnimation.value,
  ]
  return all.sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
})
export const publicTrending = computed<Movie[]>(() =>
  publicAll.value.filter((m) => m.isTrending).slice(0, 24)
)
