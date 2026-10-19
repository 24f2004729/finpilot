import {
  User,
  Transaction,
  Budget,
  MonthlySummary,
  CategoryBreakdownItem,
  SpendingInsight,
  SYSTEM_CATEGORIES,
  calculateNetCashFlow,
  calculateSavingsRate,
  calculateBudgetUtilization,
  getPreviousMonthKey,
  formatCurrency,
  exportToCsv,
  parseCsvSafe,
  centsToDollars,
  dollarsToCents,
  formatMonthDisplay,
  SupportedCurrency,
} from '@finpilot/shared';
import { ApiError } from './client';

interface StoredTransaction {
  id: string;
  userId: string;
  amountCents: number;
  type: 'income' | 'expense';
  category: string;
  occurrenceDate: string;
  description: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredBudget {
  id: string;
  userId: string;
  category: string;
  monthKey: string;
  limitCents: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredDismissal {
  id: string;
  userId: string;
  insightKey: string;
  monthKey: string;
  dismissedAt: string;
}

interface FinPilotStore {
  users: User[];
  currentUserId: string | null;
  transactions: StoredTransaction[];
  budgets: StoredBudget[];
  dismissals: StoredDismissal[];
}

const STORAGE_KEY = 'finpilot_local_store_v1';
const DEMO_USER_ID = 'demo-user-alex-2026';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11);
}

function getInitialStore(): FinPilotStore {
  const now = '2026-10-20T00:00:00.000Z';
  const demoUser: User = {
    id: DEMO_USER_ID,
    email: 'alex@finpilot.dev',
    fullName: 'Alex Morgan',
    currency: 'USD',
    isDemo: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: now,
  };

  const rawAugust = [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income' as const, cents: 650000, day: '01' },
    { desc: 'Freelance Architectural Review', cat: 'freelance', type: 'income' as const, cents: 120000, day: '15' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense' as const, cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Electric Utility', cat: 'utilities', type: 'expense' as const, cents: 21500, day: '05' },
    { desc: 'Whole Foods Market', cat: 'food', type: 'expense' as const, cents: 31000, day: '08' },
    { desc: 'Blue Bottle & Bistro Lunches', cat: 'food', type: 'expense' as const, cents: 14500, day: '14' },
    { desc: 'Metro Transit Pass', cat: 'transportation', type: 'expense' as const, cents: 12000, day: '03' },
    { desc: 'Healthcare Insurance Co-Pay', cat: 'healthcare', type: 'expense' as const, cents: 15000, day: '10' },
    { desc: 'Fitness Club Membership', cat: 'entertainment', type: 'expense' as const, cents: 9500, day: '01' },
    { desc: 'Books & Online Courses', cat: 'education', type: 'expense' as const, cents: 8500, day: '20' },
  ];

  const rawSeptember = [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income' as const, cents: 650000, day: '01' },
    { desc: 'Freelance Consulting Payout', cat: 'freelance', type: 'income' as const, cents: 150000, day: '18' },
    { desc: 'Dividend Reinvestment', cat: 'investments', type: 'income' as const, cents: 45000, day: '25' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense' as const, cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Electric Utility', cat: 'utilities', type: 'expense' as const, cents: 23000, day: '05' },
    { desc: 'Trader Joe & Whole Foods', cat: 'food', type: 'expense' as const, cents: 33500, day: '09' },
    { desc: 'Fine Dining & Sushi Dinner', cat: 'food', type: 'expense' as const, cents: 18000, day: '22' },
    { desc: 'Metro Transit & Rideshare', cat: 'transportation', type: 'expense' as const, cents: 14500, day: '12' },
    { desc: 'Dental Cleaning & Preventive Care', cat: 'healthcare', type: 'expense' as const, cents: 11000, day: '16' },
    { desc: 'Streaming Services & Concert', cat: 'entertainment', type: 'expense' as const, cents: 16500, day: '24' },
    { desc: 'Workstation Accessories', cat: 'shopping', type: 'expense' as const, cents: 24000, day: '19' },
  ];

  const rawOctober = [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income' as const, cents: 650000, day: '01' },
    { desc: 'Freelance Advisory Payout', cat: 'freelance', type: 'income' as const, cents: 140000, day: '12' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense' as const, cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Power Utility', cat: 'utilities', type: 'expense' as const, cents: 24000, day: '04' },
    { desc: 'Gourmet Groceries & Organic Market', cat: 'food', type: 'expense' as const, cents: 39500, day: '06' },
    { desc: 'Omakase Dinner with Team', cat: 'food', type: 'expense' as const, cents: 22000, day: '11' },
    { desc: 'Artisanal Cafe & Bakery', cat: 'food', type: 'expense' as const, cents: 8500, day: '17' },
    { desc: 'Transit Pass & Rideshare', cat: 'transportation', type: 'expense' as const, cents: 13500, day: '08' },
    { desc: 'Prescription & Vitamins', cat: 'healthcare', type: 'expense' as const, cents: 9500, day: '14' },
    { desc: 'Symphony Hall Tickets', cat: 'entertainment', type: 'expense' as const, cents: 14000, day: '15' },
    { desc: 'Mechanical Keyboard Upgrade', cat: 'shopping', type: 'expense' as const, cents: 28500, day: '09' },
    { desc: 'Professional Cloud Certification Exam', cat: 'education', type: 'expense' as const, cents: 30000, day: '18' },
  ];

  const transactions: StoredTransaction[] = [];

  rawAugust.forEach(item => {
    transactions.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      amountCents: item.cents,
      type: item.type,
      category: item.cat,
      occurrenceDate: `2026-08-${item.day}`,
      description: item.desc,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  rawSeptember.forEach(item => {
    transactions.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      amountCents: item.cents,
      type: item.type,
      category: item.cat,
      occurrenceDate: `2026-09-${item.day}`,
      description: item.desc,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  rawOctober.forEach(item => {
    transactions.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      amountCents: item.cents,
      type: item.type,
      category: item.cat,
      occurrenceDate: `2026-10-${item.day}`,
      description: item.desc,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  const budgets: StoredBudget[] = [
    { id: generateId(), userId: DEMO_USER_ID, category: 'housing', monthKey: '2026-10', limitCents: 180000, createdAt: now, updatedAt: now },
    { id: generateId(), userId: DEMO_USER_ID, category: 'food', monthKey: '2026-10', limitCents: 50000, createdAt: now, updatedAt: now },
    { id: generateId(), userId: DEMO_USER_ID, category: 'utilities', monthKey: '2026-10', limitCents: 27000, createdAt: now, updatedAt: now },
    { id: generateId(), userId: DEMO_USER_ID, category: 'transportation', monthKey: '2026-10', limitCents: 18000, createdAt: now, updatedAt: now },
    { id: generateId(), userId: DEMO_USER_ID, category: 'shopping', monthKey: '2026-10', limitCents: 30000, createdAt: now, updatedAt: now },
    { id: generateId(), userId: DEMO_USER_ID, category: 'entertainment', monthKey: '2026-10', limitCents: 25000, createdAt: now, updatedAt: now },
  ];

  return {
    users: [demoUser],
    currentUserId: null,
    transactions,
    budgets,
    dismissals: [],
  };
}

function loadStore(): FinPilotStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStore();
      saveStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.transactions || !parsed.budgets || !parsed.users) {
      const initial = getInitialStore();
      saveStore(initial);
      return initial;
    }
    return parsed;
  } catch {
    const initial = getInitialStore();
    saveStore(initial);
    return initial;
  }
}

function saveStore(store: FinPilotStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[FinPilot] Unable to write to localStorage:', err);
  }
}

function getCurrentUser(store: FinPilotStore): User {
  const token = localStorage.getItem('finpilot_token');
  if (token === 'demo-token-alex-2026' || (!token && store.currentUserId === DEMO_USER_ID)) {
    return store.users.find(u => u.id === DEMO_USER_ID) || store.users[0];
  }
  if (token && token.startsWith('token-')) {
    const userId = token.replace('token-', '');
    const user = store.users.find(u => u.id === userId);
    if (user) return user;
  }
  if (store.currentUserId) {
    const user = store.users.find(u => u.id === store.currentUserId);
    if (user) return user;
  }
  return store.users.find(u => u.id === DEMO_USER_ID) || store.users[0];
}

export async function handleMockRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const [urlPath, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');
  const body = options.body ? JSON.parse(options.body as string) : {};

  const store = loadStore();

  // Route: /auth/me
  if (urlPath === '/auth/me') {
    const token = localStorage.getItem('finpilot_token');
    if (!token) {
      throw new ApiError('Not authenticated.', 'UNAUTHORIZED');
    }
    const user = getCurrentUser(store);
    return { user } as unknown as T;
  }

  // Route: /auth/demo
  if (urlPath === '/auth/demo') {
    const demoUser = store.users.find(u => u.id === DEMO_USER_ID) || store.users[0];
    store.currentUserId = DEMO_USER_ID;
    saveStore(store);
    const token = 'demo-token-alex-2026';
    localStorage.setItem('finpilot_token', token);
    return { user: demoUser, token } as unknown as T;
  }

  // Route: /auth/login
  if (urlPath === '/auth/login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const isDemo = email === 'alex@finpilot.dev' || email === 'demo@finpilot.dev';
    
    if (isDemo) {
      const demoUser = store.users.find(u => u.id === DEMO_USER_ID) || store.users[0];
      store.currentUserId = DEMO_USER_ID;
      saveStore(store);
      const token = 'demo-token-alex-2026';
      localStorage.setItem('finpilot_token', token);
      return { user: demoUser, token } as unknown as T;
    }

    const matched = store.users.find(u => u.email.toLowerCase() === email);
    if (!matched) {
      throw new ApiError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    store.currentUserId = matched.id;
    saveStore(store);
    const token = `token-${matched.id}`;
    localStorage.setItem('finpilot_token', token);
    return { user: matched, token } as unknown as T;
  }

  // Route: /auth/register
  if (urlPath === '/auth/register' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase();
    const existing = store.users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      throw new ApiError('An account with this email address already exists. Please sign in instead.', 'EMAIL_EXISTS');
    }

    const newUser: User = {
      id: generateId(),
      email,
      fullName: body.fullName || 'FinPilot User',
      currency: (body.currency || 'USD') as SupportedCurrency,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    store.currentUserId = newUser.id;
    saveStore(store);

    const token = `token-${newUser.id}`;
    localStorage.setItem('finpilot_token', token);
    return { user: newUser, token } as unknown as T;
  }

  // Route: /auth/logout
  if (urlPath === '/auth/logout') {
    store.currentUserId = null;
    saveStore(store);
    localStorage.removeItem('finpilot_token');
    return { success: true } as unknown as T;
  }

  // Authenticated context
  const currentUser = getCurrentUser(store);
  const userId = currentUser.id;

  // Route: /analytics/summary
  if (urlPath === '/analytics/summary') {
    const monthKey = params.get('month') || '2026-10';
    const userTxs = store.transactions.filter(
      t => t.userId === userId && t.occurrenceDate.startsWith(monthKey)
    );

    const totalIncomeCents = userTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amountCents, 0);

    const totalExpenseCents = userTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountCents, 0);

    const netCashFlowCents = calculateNetCashFlow(totalIncomeCents, totalExpenseCents);
    const savingsRatePercent = calculateSavingsRate(totalIncomeCents, totalExpenseCents);

    const summary: MonthlySummary = {
      monthKey,
      totalIncomeCents,
      totalExpenseCents,
      netCashFlowCents,
      savingsRatePercent,
      currency: currentUser.currency,
    };

    return { summary } as unknown as T;
  }

  // Route: /analytics/categories
  if (urlPath === '/analytics/categories') {
    const monthKey = params.get('month') || '2026-10';
    const expenseTxs = store.transactions.filter(
      t => t.userId === userId && t.type === 'expense' && t.occurrenceDate.startsWith(monthKey)
    );

    const totalExpenseCents = expenseTxs.reduce((sum, t) => sum + t.amountCents, 0);
    const categoryTotals = new Map<string, { totalCents: number; count: number }>();

    for (const t of expenseTxs) {
      const cur = categoryTotals.get(t.category) || { totalCents: 0, count: 0 };
      cur.totalCents += t.amountCents;
      cur.count += 1;
      categoryTotals.set(t.category, cur);
    }

    const breakdown: CategoryBreakdownItem[] = Array.from(categoryTotals.entries())
      .map(([catId, data]) => {
        const catDef = SYSTEM_CATEGORIES.find(c => c.id === catId);
        const categoryName = catDef ? catDef.name : catId;
        const color = catDef ? catDef.color : '#94A3B8';
        const percentageOfExpenses =
          totalExpenseCents > 0
            ? Math.round((data.totalCents / totalExpenseCents) * 1000) / 10
            : 0;

        return {
          category: catId,
          categoryName,
          color,
          totalCents: data.totalCents,
          percentageOfExpenses,
          transactionCount: data.count,
        };
      })
      .sort((a, b) => b.totalCents - a.totalCents);

    return { breakdown } as unknown as T;
  }

  // Route: /analytics/insights
  if (urlPath === '/analytics/insights') {
    const currentMonthKey = params.get('month') || '2026-10';
    const m1 = getPreviousMonthKey(currentMonthKey);
    const m2 = getPreviousMonthKey(m1);
    const m3 = getPreviousMonthKey(m2);

    const curExpenses = store.transactions.filter(
      t => t.userId === userId && t.type === 'expense' && t.occurrenceDate.startsWith(currentMonthKey)
    );

    const curSpendMap = new Map<string, number>();
    for (const t of curExpenses) {
      curSpendMap.set(t.category, (curSpendMap.get(t.category) || 0) + t.amountCents);
    }

    const histExpenses = store.transactions.filter(
      t =>
        t.userId === userId &&
        t.type === 'expense' &&
        (t.occurrenceDate.startsWith(m1) || t.occurrenceDate.startsWith(m2) || t.occurrenceDate.startsWith(m3))
    );

    const histSpendMap = new Map<string, { total: number; months: Set<string> }>();
    for (const t of histExpenses) {
      const m = t.occurrenceDate.substring(0, 7);
      const cur = histSpendMap.get(t.category) || { total: 0, months: new Set<string>() };
      cur.total += t.amountCents;
      cur.months.add(m);
      histSpendMap.set(t.category, cur);
    }

    const dismissedKeys = new Set(
      store.dismissals
        .filter(d => d.userId === userId && d.monthKey === currentMonthKey)
        .map(d => d.insightKey)
    );

    const insights: SpendingInsight[] = [];

    for (const [category, curTotal] of curSpendMap.entries()) {
      const hist = histSpendMap.get(category);
      if (!hist || hist.total <= 0) continue;
      const baseline = Math.round(hist.total / Math.max(hist.months.size, 1));
      if (baseline <= 0) continue;

      const diffCents = curTotal - baseline;
      const pctDiff = Math.round((diffCents / baseline) * 100);

      if (Math.abs(pctDiff) >= 20 && Math.abs(diffCents) >= 3000) {
        const catDef = SYSTEM_CATEGORIES.find(c => c.id === category);
        const categoryName = catDef ? catDef.name : category;
        const insightKey = `spending_delta_${category}`;
        const isHigher = diffCents > 0;
        const formattedCur = formatCurrency(curTotal, currentUser.currency);
        const formattedBase = formatCurrency(baseline, currentUser.currency);
        const formattedDiff = formatCurrency(Math.abs(diffCents), currentUser.currency);

        const headline = isHigher
          ? `${categoryName} spending is ${pctDiff}% higher than average`
          : `${categoryName} spending is ${Math.abs(pctDiff)}% below average`;

        const explanation = isHigher
          ? `You have spent ${formattedCur} this month compared to your 3-month baseline average of ${formattedBase} (a difference of +${formattedDiff}).`
          : `You have spent ${formattedCur} this month compared to your 3-month baseline average of ${formattedBase} (a difference of -${formattedDiff}).`;

        insights.push({
          id: insightKey,
          category,
          categoryName,
          monthKey: currentMonthKey,
          currentSpendCents: curTotal,
          baselineSpendCents: baseline,
          percentageDifference: pctDiff,
          amountDifferenceCents: diffCents,
          headline,
          explanation,
          dismissed: dismissedKeys.has(insightKey),
        });
      }
    }

    return { insights } as unknown as T;
  }

  // Route: /analytics/insights/dismiss
  if (urlPath === '/analytics/insights/dismiss' && method === 'POST') {
    const { insightKey, monthKey } = body;
    const existing = store.dismissals.find(
      d => d.userId === userId && d.insightKey === insightKey && d.monthKey === monthKey
    );
    if (!existing) {
      store.dismissals.push({
        id: generateId(),
        userId,
        insightKey,
        monthKey,
        dismissedAt: new Date().toISOString(),
      });
      saveStore(store);
    }
    return { success: true } as unknown as T;
  }

  // Route: /budgets
  if (urlPath === '/budgets') {
    const monthKey = params.get('monthKey') || '2026-10';

    if (method === 'GET') {
      const userBudgets = store.budgets.filter(b => b.userId === userId && b.monthKey === monthKey);

      const expenseSums = new Map<string, number>();
      store.transactions
        .filter(t => t.userId === userId && t.type === 'expense' && t.occurrenceDate.startsWith(monthKey))
        .forEach(t => {
          expenseSums.set(t.category, (expenseSums.get(t.category) || 0) + t.amountCents);
        });

      const budgets: Budget[] = userBudgets.map(b => {
        const spentCents = expenseSums.get(b.category) || 0;
        const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(
          spentCents,
          b.limitCents
        );

        return {
          id: b.id,
          userId: b.userId,
          category: b.category,
          monthKey: b.monthKey,
          limitCents: b.limitCents,
          spentCents,
          remainingCents,
          utilizationPercent,
          status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      });

      return { budgets } as unknown as T;
    }

    if (method === 'POST') {
      const existing = store.budgets.find(
        b => b.userId === userId && b.category === body.category && b.monthKey === body.monthKey
      );
      if (existing) {
        const monthName = formatMonthDisplay(body.monthKey);
        throw new ApiError(
          `This category already has a budget for ${monthName}. Edit the existing budget or choose another category.`,
          'CONFLICT'
        );
      }

      const now = new Date().toISOString();
      const newBudget: StoredBudget = {
        id: generateId(),
        userId,
        category: body.category,
        monthKey: body.monthKey,
        limitCents: body.limitCents,
        createdAt: now,
        updatedAt: now,
      };

      store.budgets.push(newBudget);
      saveStore(store);

      const spentCents = store.transactions
        .filter(t => t.userId === userId && t.type === 'expense' && t.category === body.category && t.occurrenceDate.startsWith(body.monthKey))
        .reduce((sum, t) => sum + t.amountCents, 0);

      const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(spentCents, body.limitCents);

      const result: Budget = {
        id: newBudget.id,
        userId: newBudget.userId,
        category: newBudget.category,
        monthKey: newBudget.monthKey,
        limitCents: newBudget.limitCents,
        spentCents,
        remainingCents,
        utilizationPercent,
        status,
        createdAt: now,
        updatedAt: now,
      };

      return { budget: result } as unknown as T;
    }
  }

  // Route: /budgets/:id
  if (urlPath.startsWith('/budgets/')) {
    const budgetId = urlPath.replace('/budgets/', '');

    if (method === 'PUT') {
      const idx = store.budgets.findIndex(b => b.id === budgetId && b.userId === userId);
      if (idx === -1) {
        throw new ApiError('Budget not found.', 'NOT_FOUND');
      }

      store.budgets[idx].limitCents = body.limitCents;
      store.budgets[idx].updatedAt = new Date().toISOString();
      saveStore(store);

      const b = store.budgets[idx];
      const spentCents = store.transactions
        .filter(t => t.userId === userId && t.type === 'expense' && t.category === b.category && t.occurrenceDate.startsWith(b.monthKey))
        .reduce((sum, t) => sum + t.amountCents, 0);

      const { remainingCents, utilizationPercent, status } = calculateBudgetUtilization(spentCents, b.limitCents);

      const updated: Budget = {
        ...b,
        spentCents,
        remainingCents,
        utilizationPercent,
        status,
      };
      return { budget: updated } as unknown as T;
    }

    if (method === 'DELETE') {
      const beforeCount = store.budgets.length;
      store.budgets = store.budgets.filter(b => !(b.id === budgetId && b.userId === userId));
      if (store.budgets.length === beforeCount) {
        throw new ApiError('Budget not found.', 'NOT_FOUND');
      }
      saveStore(store);
      return { success: true } as unknown as T;
    }
  }

  // Route: /transactions/export
  if (urlPath === '/transactions/export') {
    const monthKey = params.get('monthKey');
    let txs = store.transactions.filter(t => t.userId === userId);
    if (monthKey) {
      txs = txs.filter(t => t.occurrenceDate.startsWith(monthKey));
    }
    txs.sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));

    const rows = txs.map(t => ({
      date: t.occurrenceDate,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: centsToDollars(t.amountCents).toFixed(2),
      notes: t.notes || '',
    }));

    const csvString = exportToCsv(rows, [
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount' },
      { key: 'notes', label: 'Notes' },
    ]);

    return csvString as unknown as T;
  }

  // Route: /transactions/import
  if (urlPath === '/transactions/import' && method === 'POST') {
    const { csvText } = body;
    if (!csvText || typeof csvText !== 'string') {
      throw new ApiError('Please provide CSV file content.', 'INVALID_CSV');
    }
    const rows = parseCsvSafe(csvText);
    if (rows.length === 0) {
      throw new ApiError('No valid transaction rows found in CSV.', 'INVALID_CSV');
    }

    const now = new Date().toISOString();
    rows.forEach(r => {
      store.transactions.push({
        id: generateId(),
        userId,
        amountCents: dollarsToCents(r.amount),
        type: r.type,
        category: r.category,
        occurrenceDate: r.date,
        description: r.description,
        notes: r.notes || null,
        createdAt: now,
        updatedAt: now,
      });
    });

    saveStore(store);
    return { importedCount: rows.length } as unknown as T;
  }

  // Route: /transactions
  if (urlPath === '/transactions') {
    if (method === 'GET') {
      const monthKey = params.get('monthKey');
      const category = params.get('category');
      const type = params.get('type');
      const search = params.get('search')?.toLowerCase();
      const page = parseInt(params.get('page') || '1', 10);
      const limit = parseInt(params.get('limit') || '20', 10);

      let filtered = store.transactions.filter(t => t.userId === userId);

      if (monthKey) {
        filtered = filtered.filter(t => t.occurrenceDate.startsWith(monthKey));
      }
      if (category) {
        filtered = filtered.filter(t => t.category === category);
      }
      if (type) {
        filtered = filtered.filter(t => t.type === type);
      }
      if (search) {
        filtered = filtered.filter(
          t => t.description.toLowerCase().includes(search) || (t.notes && t.notes.toLowerCase().includes(search))
        );
      }

      filtered.sort((a, b) => {
        const dateDiff = b.occurrenceDate.localeCompare(a.occurrenceDate);
        if (dateDiff !== 0) return dateDiff;
        return b.createdAt.localeCompare(a.createdAt);
      });

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      const transactions: Transaction[] = paginated.map(t => ({
        id: t.id,
        userId: t.userId,
        amountCents: t.amountCents,
        type: t.type,
        category: t.category,
        occurrenceDate: t.occurrenceDate,
        description: t.description,
        notes: t.notes,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

      return {
        transactions,
        total,
        page,
        totalPages,
      } as unknown as T;
    }

    if (method === 'POST') {
      const now = new Date().toISOString();
      const newTx: StoredTransaction = {
        id: generateId(),
        userId,
        amountCents: body.amountCents,
        type: body.type,
        category: body.category,
        occurrenceDate: body.occurrenceDate,
        description: body.description,
        notes: body.notes || null,
        createdAt: now,
        updatedAt: now,
      };

      store.transactions.unshift(newTx);
      saveStore(store);

      const transaction: Transaction = { ...newTx };
      return { transaction } as unknown as T;
    }
  }

  // Route: /transactions/:id
  if (urlPath.startsWith('/transactions/')) {
    const txId = urlPath.replace('/transactions/', '');

    if (method === 'PUT') {
      const idx = store.transactions.findIndex(t => t.id === txId && t.userId === userId);
      if (idx === -1) {
        throw new ApiError('Transaction not found.', 'NOT_FOUND');
      }

      const existing = store.transactions[idx];
      const updated: StoredTransaction = {
        ...existing,
        amountCents: body.amountCents !== undefined ? body.amountCents : existing.amountCents,
        type: body.type || existing.type,
        category: body.category || existing.category,
        occurrenceDate: body.occurrenceDate || existing.occurrenceDate,
        description: body.description || existing.description,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      store.transactions[idx] = updated;
      saveStore(store);
      return { transaction: updated } as unknown as T;
    }

    if (method === 'DELETE') {
      const beforeCount = store.transactions.length;
      store.transactions = store.transactions.filter(t => !(t.id === txId && t.userId === userId));
      if (store.transactions.length === beforeCount) {
        throw new ApiError('Transaction not found.', 'NOT_FOUND');
      }
      saveStore(store);
      return { success: true } as unknown as T;
    }
  }

  // Route: /user/export
  if (urlPath === '/user/export') {
    const userTxs = store.transactions.filter(t => t.userId === userId);
    const userBudgets = store.budgets.filter(b => b.userId === userId);
    return {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      transactions: userTxs,
      budgets: userBudgets,
    } as unknown as T;
  }

  // Route: /user/account
  if (urlPath === '/user/account' && method === 'DELETE') {
    store.transactions = store.transactions.filter(t => t.userId !== userId);
    store.budgets = store.budgets.filter(b => b.userId !== userId);
    store.dismissals = store.dismissals.filter(d => d.userId !== userId);
    store.users = store.users.filter(u => u.id !== userId);
    store.currentUserId = null;
    saveStore(store);
    localStorage.removeItem('finpilot_token');
    return { success: true } as unknown as T;
  }

  throw new ApiError(`Endpoint not found: ${urlPath}`, 'NOT_FOUND');
}
