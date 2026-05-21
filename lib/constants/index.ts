export const TRANSACTION_CATEGORIES = {
  INCOME: ['Sales', 'Services', 'Refunds'],
  EXPENSE: ['Office', 'Software', 'Utilities', 'Travel', 'Marketing', 'Payroll'],
} as const

export const TAX_RATES = {
  FEDERAL: 0.21,
  STATE: 0.05,
  SELF_EMPLOYMENT: 0.153,
} as const

export const DOCUMENT_TYPES = [
  'Invoice',
  'Receipt',
  'Contract',
  'Bank Statement',
  'Tax Document',
  'Expense Report',
] as const

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
} as const
