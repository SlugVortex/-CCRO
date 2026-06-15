export type ThemeType = 'light' | 'dark'

export type LayoutPositionType = 'fixed' | 'scrollable'

export type LayoutModeType = 'fluid' | 'boxed'

export type OffcanvasControlType = {
  open: boolean
  toggle: () => void
}

export type MenuType = {
  theme: ThemeType
  size: 'default' | 'compact' | 'condensed' | 'full'
}

export type LayoutState = {
  theme: ThemeType
  topbarTheme: ThemeType
  menu: MenuType
  position: LayoutPositionType
  mode: LayoutModeType
}

export type LayoutOffcanvasStatesType = {
  showThemeCustomizer: boolean
  showBackdrop: boolean
}

export type LayoutType = LayoutState & {
  themeMode: ThemeType
  changeTheme: (theme: ThemeType) => void
  changeTopbarTheme: (theme: ThemeType) => void
  changePosition: (position: LayoutPositionType) => void
  changeMode: (position: LayoutModeType) => void
  changeMenu: {
    theme: (theme: MenuType['theme']) => void
    size: (size: MenuType['size']) => void
  }
  themeCustomizer: OffcanvasControlType
  toggleBackdrop: () => void
  resetSettings: () => void
}
