import { lazy } from 'react'
import { Navigate, type RouteProps } from 'react-router-dom'

const Dashboard = lazy(() => import('@/app/(admin)/dashboard/page'))
const MapExplorer = lazy(() => import('@/app/(admin)/map-explorer/page'))
const ScenarioBuilder = lazy(() => import('@/app/(admin)/scenario-builder/page'))
const Recommendations = lazy(() => import('@/app/(admin)/recommendations/page'))
const DataAudit = lazy(() => import('@/app/(admin)/data-audit/page'))
const Error404 = lazy(() => import('@/app/(other)/(error-pages)/error-404/page'))

export type RoutesProps = {
  path: RouteProps['path']
  name: string
  element: RouteProps['element']
  exact?: boolean
}

const initialRoutes: RoutesProps[] = [
  {
    path: '/',
    name: 'root',
    element: <Navigate to="/dashboard" />,
  },
]

const appOnlyRoutes: RoutesProps[] = [
  {
    path: '/dashboard',
    name: 'Risk Dashboard',
    element: <Dashboard />,
  },
  {
    path: '/map-explorer',
    name: 'Map Explorer',
    element: <MapExplorer />,
  },
  {
    path: '/scenario-builder',
    name: 'Scenario Builder',
    element: <ScenarioBuilder />,
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    element: <Recommendations />,
  },
  {
    path: '/data-audit',
    name: 'Data & Audit',
    element: <DataAudit />,
  },
]

const otherPublicRoutes: RoutesProps[] = [
  {
    path: '*',
    name: 'Error - 404',
    element: <Error404 />,
  },
]

export const appRoutes = [...initialRoutes, ...appOnlyRoutes]
export const publicRoutes = [...otherPublicRoutes]
