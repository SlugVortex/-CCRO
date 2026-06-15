import type { MenuItemType } from '@/types/menu'

export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'mission',
    label: 'Mission',
    isTitle: true,
  },
  {
    key: 'dashboard',
    icon: 'ri:earth-line',
    label: 'Risk Map',
    badge: {
      text: 'Live',
      variant: 'danger',
    },
    url: '/dashboard',
  },
  {
    key: 'scenario-builder',
    icon: 'ri:flask-line',
    label: 'Scenario Builder',
    url: '/scenario-builder',
  },
  {
    key: 'recommendations',
    icon: 'ri:medal-line',
    label: 'Recommendations',
    url: '/recommendations',
  },
  {
    key: 'governance',
    label: 'Governance',
    isTitle: true,
  },
  {
    key: 'data-audit',
    icon: 'ri:shield-check-line',
    label: 'Data & Audit',
    url: '/data-audit',
  },
]
