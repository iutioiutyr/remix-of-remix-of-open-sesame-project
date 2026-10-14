import { ref } from '@vue/reactivity'

export const loginOpen = ref(false)
export const subscribeOpen = ref(false)
export const subscribeMovie = ref<{ id: string; title: string } | null>(null)

export const toastMsg = ref('')
export const toastType = ref<'success' | 'info'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(msg: string, type: 'success' | 'info' = 'success', duration = 6000) {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, duration)
}
