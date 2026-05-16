import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    return { theme: newTheme }
  }),
  
  setTheme: (theme) => set(() => {
    localStorage.setItem('theme', theme)
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    return { theme }
  }),
}))

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') || 'light'
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}
