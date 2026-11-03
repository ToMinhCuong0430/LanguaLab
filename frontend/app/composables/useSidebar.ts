/**
 * useSidebar — shared sidebar expanded/collapsed state
 * Uses a module-level ref so all components share the same instance.
 */

const _isExpanded = ref(true)
let _initialized = false

export function useSidebar() {
  if (import.meta.client && !_initialized) {
    _initialized = true
    const saved = localStorage.getItem('sidebar-expanded')
    if (saved !== null) {
      _isExpanded.value = saved === 'true'
    } else {
      // Default: expanded on wide screens
      _isExpanded.value = window.innerWidth >= 1024
    }
  }

  const toggle = () => {
    _isExpanded.value = !_isExpanded.value
    if (import.meta.client) {
      localStorage.setItem('sidebar-expanded', String(_isExpanded.value))
    }
  }

  const sidebarWidth = computed(() => (_isExpanded.value ? '220px' : '64px'))

  return {
    isExpanded: _isExpanded,
    toggle,
    sidebarWidth,
  }
}
