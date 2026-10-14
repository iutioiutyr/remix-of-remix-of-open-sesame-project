import { ref, watch } from '@vue/reactivity'

type Theme = 'dark' | 'light'

const stored = (typeof localStorage !== 'undefined'
  ? (localStorage.getItem('vj-theme') as Theme | null)
  : null) ?? 'dark'

export const theme = ref<Theme>(stored)

function apply(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
  if (typeof localStorage !== 'undefined') localStorage.setItem('vj-theme', t)
}

// Apply immediately on module load
apply(theme.value)

watch(theme, apply)

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
