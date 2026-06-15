
import { useTitle } from '@/context/useTitleContext'
import { useEffect } from 'react'
import { APP_NAME, DEFAULT_PAGE_TITLE } from '@/context/constants'
import { Helmet } from 'react-helmet-async'

const PageTitle = ({ title }: { title: string }) => {
  const defaultTitle = DEFAULT_PAGE_TITLE
  const { setTitle } = useTitle()

  useEffect(() => {
    setTitle(title)
  }, [setTitle, title])
  return (
    <Helmet>
      <title>{title ? `${title} | ${APP_NAME}` : defaultTitle}</title>
    </Helmet>
  )
}

export default PageTitle
