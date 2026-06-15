import { Link } from 'react-router-dom'
import ccroMark from '@/assets/images/ccro-mark.svg'
import { APP_NAME, APP_SHORT_NAME } from '@/context/constants'

const LogoBox = () => {
  return (
    <>
      <Link to="/" className="logo logo-light stormy-logo">
        <span className="logo-lg">
          <span className="stormy-brand-lockup">
            <img src={ccroMark} className="w-auto" alt={`${APP_NAME} logo`} />
            <span className="stormy-brand-copy">
              <strong>{APP_SHORT_NAME}</strong>
              <small>Climate Orchestrator</small>
            </span>
          </span>
        </span>
        <span className="logo-sm">
          <img src={ccroMark} className="w-auto" alt={`${APP_NAME} mark`} />
        </span>
      </Link>

      <Link to="/" className="logo logo-dark stormy-logo">
        <span className="logo-lg">
          <span className="stormy-brand-lockup">
            <img src={ccroMark} className="w-auto" alt={`${APP_NAME} logo`} />
            <span className="stormy-brand-copy">
              <strong>{APP_SHORT_NAME}</strong>
              <small>Climate Orchestrator</small>
            </span>
          </span>
        </span>
        <span className="logo-sm">
          <img src={ccroMark} className="w-auto" alt={`${APP_NAME} mark`} />
        </span>
      </Link>
    </>
  )
}

export default LogoBox
