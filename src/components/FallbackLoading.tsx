import ccroMark from '@/assets/images/ccro-mark.svg'
import { APP_SHORT_NAME } from '@/context/constants'

const FallbackLoading = () => {
  return (
    <div className="ccro-loader-inline" role="status" aria-live="polite">
      <img src={ccroMark} alt="" aria-hidden="true" />
      <span>{APP_SHORT_NAME} loading the workbench...</span>
    </div>
  )
}

export default FallbackLoading
