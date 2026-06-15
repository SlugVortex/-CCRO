

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useLayoutContext } from '@/context/useLayoutContext'

const ThemeModeToggle = () => {
  const { changeTheme, themeMode } = useLayoutContext()

  const handleThemeToggle = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
    changeTheme(nextTheme)
  }

  return (
    <li className="d-none d-sm-inline-block">
      <button
        type="button"
        className="nav-link border-0 bg-transparent"
        id="light-dark-mode"
        aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
        onClick={handleThemeToggle}>
        {themeMode === 'light' ? <IconifyIcon icon="ri:moon-line" className="fs-22" /> : <IconifyIcon icon="ri:sun-line" className="fs-22" />}
      </button>
    </li>
  )
}
export default ThemeModeToggle
