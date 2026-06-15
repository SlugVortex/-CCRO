import LogoBox from '@/components/LogoBox'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import { Badge } from 'react-bootstrap'
import LeftSidebarToggle from './components/LeftSidebarToggle'
import ThemeModeToggle from './components/ThemeModeToggle'
import TopbarTitle from './components/TopbarTitle'

const TopNavigationBar = () => {
  const { dashboard, filters, health } = useClimateWorkbench()

  return (
    <div className="navbar-custom">
      <div className="topbar container-fluid">
        <div className="d-flex align-items-center gap-1">
          <div className="logo-topbar">
            <LogoBox />
          </div>
          <LeftSidebarToggle />
          <TopbarTitle />
        </div>

        <ul className="topbar-menu d-flex align-items-center gap-3">
          <li className="d-none d-md-flex align-items-center">
            <div className="stormy-topbar-chip">
              <span>{dashboard?.country_name ?? 'No country'}</span>
              <strong>{filters.horizonYear}</strong>
            </div>
          </li>
          <li className="d-none d-xl-flex align-items-center">
            <div className="stormy-topbar-chip">
              <span>Reasoning Track</span>
              <strong>{health?.azure_openai_enabled ? 'Live Azure' : 'Local Mode'}</strong>
            </div>
          </li>
          <li className="d-none d-lg-flex align-items-center">
            <Badge bg={health?.azure_openai_enabled ? 'success' : 'warning'} className="stormy-topbar-badge">
              {health?.azure_openai_enabled ? 'Azure AI connected' : 'Local pipeline active'}
            </Badge>
          </li>
          <ThemeModeToggle />
        </ul>
      </div>
    </div>
  )
}

export default TopNavigationBar
