export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  date: string
  status: 'pending' | 'completed' | 'failed'
  type: 'income' | 'expense'
}

export interface Document {
  id: string
  name: string
  type: string
  status: 'pending' | 'processing' | 'processed' | 'error'
  uploaded_at: string
  url?: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface TaxPayment {
  id: string
  quarter: string
  year: number
  amount: number
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue'
}

// Auth types
export type UserRole = 'owner' | 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface Session {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: UserRole
  invited_at: string
  joined_at?: string
  status: 'pending' | 'active' | 'inactive'
}
