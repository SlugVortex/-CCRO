import type { ReactNode } from 'react'

export type BootstrapVariantType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'dark'
  | 'light'

export type ChildrenType = Readonly<{ children: ReactNode }>
