import ccroMark from '@/assets/images/ccro-mark.svg'
import { APP_NAME } from '@/context/constants'

const Preloader = () => (
  <div className="ccro-loader-shell" role="status" aria-live="polite">
    <div className="ccro-loader-brand">
      <img src={ccroMark} alt="" aria-hidden="true" />
      <div>
        <strong>{APP_NAME}</strong>
        <span>Preparing the climate resilience workbench...</span>
      </div>
    </div>
    <div className="ccro-loader-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </div>
)

export default Preloader
