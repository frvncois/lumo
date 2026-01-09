import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lumo-theme'

// Global theme state
const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'light')

// Apply theme to document
function applyTheme(newTheme: Theme) {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Initialize theme on load
applyTheme(theme.value)

// Watch for theme changes
watch(theme, (newTheme) => {
  localStorage.setItem(STORAGE_KEY, newTheme)
  applyTheme(newTheme)
})

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
