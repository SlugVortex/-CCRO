import { ClimateWorkbenchProvider } from '@/context/useClimateWorkbenchContext'
import { LayoutProvider } from '@/context/useLayoutContext'
import { TitleProvider } from '@/context/useTitleContext'
import type { ChildrenType } from '@/types/common'
import { HelmetProvider } from 'react-helmet-async'

const AppProvidersWrapper = ({ children }: ChildrenType) => {
  return (
    <HelmetProvider>
      <LayoutProvider>
        <TitleProvider>
          <ClimateWorkbenchProvider>{children}</ClimateWorkbenchProvider>
        </TitleProvider>
      </LayoutProvider>
    </HelmetProvider>
  )
}
export default AppProvidersWrapper
