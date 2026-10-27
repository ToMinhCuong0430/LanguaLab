import { navigationItems, footerLinks } from '~/config/navigation'

export const useNavigation = () => {
  const route = useRoute()

  const isActive = (path: string) => {
    if (path === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(path)
  }

  return {
    items: navigationItems,
    footerLinks,
    isActive,
  }
}
