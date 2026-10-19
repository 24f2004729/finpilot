export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  isExpense: boolean;
}

export const SYSTEM_CATEGORIES: CategoryDefinition[] = [
  // Expense categories
  { id: 'housing', name: 'Housing & Rent', icon: 'Home', color: '#6366F1', isExpense: true },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#0EA5E9', isExpense: true },
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B', isExpense: true },
  { id: 'transportation', name: 'Transportation', icon: 'Car', color: '#8B5CF6', isExpense: true },
  { id: 'healthcare', name: 'Healthcare & Medical', icon: 'Activity', color: '#EC4899', isExpense: true },
  { id: 'entertainment', name: 'Entertainment & Leisure', icon: 'Film', color: '#10B981', isExpense: true },
  { id: 'shopping', name: 'Shopping & Personal', icon: 'ShoppingBag', color: '#F97316', isExpense: true },
  { id: 'education', name: 'Education & Self-Improvement', icon: 'BookOpen', color: '#14B8A6', isExpense: true },
  { id: 'other_expense', name: 'Miscellaneous Expense', icon: 'MoreHorizontal', color: '#64748B', isExpense: true },
  
  // Income categories
  { id: 'salary', name: 'Salary & Wages', icon: 'Briefcase', color: '#10B981', isExpense: false },
  { id: 'freelance', name: 'Freelance & Consulting', icon: 'Laptop', color: '#06B6D4', isExpense: false },
  { id: 'investments', name: 'Investment Returns', icon: 'TrendingUp', color: '#84CC16', isExpense: false },
  { id: 'other_income', name: 'Other Income', icon: 'DollarSign', color: '#22C55E', isExpense: false },
];

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'INR', 'AUD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const DEMO_USER_EMAIL = 'demo@finpilot.dev';
export const DEMO_USER_NAME = 'Alex Morgan';
