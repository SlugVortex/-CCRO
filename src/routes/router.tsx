import { Route, Routes, type RouteProps } from 'react-router-dom'

import { appRoutes, publicRoutes } from '@/routes/index'
import AdminLayout from '@/layouts/AdminLayout'
import OtherLayout from '@/layouts/OtherLayout'

const AppRouter = (props: RouteProps) => {
  return (
    <Routes>
      {(appRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<AdminLayout {...props}>{route.element}</AdminLayout>} />
      ))}

      {publicRoutes.map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<OtherLayout {...props}>{route.element}</OtherLayout>} />
      ))}
    </Routes>
  )
}

export default AppRouter
