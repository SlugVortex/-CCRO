import FallbackLoading from '@/components/FallbackLoading'
import { APP_NAME, currentYear } from '@/context/constants'
import type { ChildrenType } from '@/types/common'
import { Suspense, useEffect } from 'react'

const OtherLayout = ({ children }: ChildrenType) => {
  useEffect(() => {
    document.body.classList.add('authentication-bg', 'position-relative')
    document.body.style.height = '100vh'

    return () => {
      document.body.classList.remove('authentication-bg', 'position-relative')
      document.body.style.height = '100vh'
    }
  }, [])

  return (
    <>
      <Suspense fallback={<FallbackLoading />}>{children}</Suspense>

      <footer className="footer footer-alt fw-medium">
        <span className="text-dark-emphasis">{currentYear} (c) {APP_NAME}</span>
      </footer>
    </>
  )
}

export default OtherLayout
