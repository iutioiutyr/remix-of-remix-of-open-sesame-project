import { ref, onMounted } from '@vue/reactivity'

const deferredPrompt = ref<any>(null)
const isInstallable = ref(false)
const isInstalled = ref(false)

// Register service worker once at module load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Listen for the browser's install prompt
window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault()
  deferredPrompt.value = e
  isInstallable.value = true
})

// Hide button once app is installed
window.addEventListener('appinstalled', () => {
  isInstallable.value = false
  isInstalled.value = true
  deferredPrompt.value = null
})

export function usePWAInstall() {
  async function promptInstall() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      isInstallable.value = false
      deferredPrompt.value = null
    }
  }

  return { isInstallable, isInstalled, promptInstall }
}
