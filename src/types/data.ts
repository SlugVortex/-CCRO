import type { IconifyIconProps } from '@iconify/react'
import type { BootstrapVariantType } from './component-props'

export type IdType = string

export type LanguageType = {
  name: string
  flag: string
}

export type MessageType = {
  name: string
  avatar: string
  description: string
  createdAt: Date
}

export type NotificationType = {
  title: string
  icon: IconifyIconProps
  time: Date
  variant: string
}

export type UserType = {
  id: string
  name: string
  avatar: string
  location: string
}

export type OrderType = {
  id: string
  userId: UserType['id']
  user?: UserType
  orderId: number
  price: number
  requestedBy: string
  status: 'Pending Approval' | 'Cancelled Requested' | 'Approved'
}

export type OrderStatusType = {
  icon: IconifyIconProps
  title: string
  description: string
  time: Date
}

export type KanbanSectionType = {
  id: IdType
  title: string
}

export type KanbanTaskType = {
  id: IdType
  sectionId: KanbanSectionType['id']
  section?: KanbanSectionType
  title: string
  description?: string
  image?: string
  variant: string
  views: number
  share: number
  commentsCount: number
  progress?: number
  members: string[]
}

export type InvoiceType = {
  id: IdType
  userId: UserType['id']
  user?: UserType
  product: string
  date: Date
  amount: number
  vendor: string
  status: 'Paid' | 'Unpaid'
  review: {
    rate: number
    vote: string
  }
}

export type ReferralType = {
  image: string
  name: string
  view: string
  sales: number
  conversion: string
  total: number
  rate: number
}

export type ContactType = {
  id: IdType
  image: string
  userId: UserType['id']
  user?: UserType
  position: string
  social: {
    follower: number
    following: number
    post: number
  }
}

export type ActivityType = {
  name: string
  title: string
  description?: string
  images?: string[]
  time: Date
}

export type ProjectType = {
  name: string
  startDate: Date
  dueDate: Date
  status: 'Work in Progress' | 'Pending' | 'Done' | 'Coming soon'
}

export type TimelineType = {
  [key: string]: {
    date: string
    time: string
    text: string
    images?: string[]
    variant?: string
  }[]
}

export type PricingPlanType = {
  name: string
  icon: IconifyIconProps
  price: number
  description: string
  features: {
    icon: IconifyIconProps
    name: string
  }[]
  variant: BootstrapVariantType
}
