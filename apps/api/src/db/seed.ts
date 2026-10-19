import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from '@finpilot/shared';

export function seedDemoWorkspace(): { userId: string } {
  // Check if demo user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_USER_EMAIL) as { id: string } | undefined;

  let userId: string;
  const now = new Date().toISOString();

  if (existingUser) {
    userId = existingUser.id;
    // Wipe existing demo user's transactions and budgets to guarantee clean deterministic state
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM budgets WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM insight_dismissals WHERE user_id = ?').run(userId);
  } else {
    userId = uuidv4();
    const passwordHash = bcrypt.hashSync('DemoPilot2026!', 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, currency, is_demo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, DEMO_USER_EMAIL, passwordHash, DEMO_USER_NAME, 'USD', now, now);
  }

  // Seed August 2026
  seedMonthTransactions(userId, '2026-08', [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income', cents: 650000, day: '01' },
    { desc: 'Freelance Architectural Review', cat: 'freelance', type: 'income', cents: 120000, day: '15' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense', cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Electric Utility', cat: 'utilities', type: 'expense', cents: 21500, day: '05' },
    { desc: 'Whole Foods Market', cat: 'food', type: 'expense', cents: 31000, day: '08' },
    { desc: 'Blue Bottle & Bistro Lunches', cat: 'food', type: 'expense', cents: 14500, day: '14' },
    { desc: 'Metro Transit Pass', cat: 'transportation', type: 'expense', cents: 12000, day: '03' },
    { desc: 'Healthcare Insurance Co-Pay', cat: 'healthcare', type: 'expense', cents: 15000, day: '10' },
    { desc: 'Fitness Club Membership', cat: 'entertainment', type: 'expense', cents: 9500, day: '01' },
    { desc: 'Books & Online Courses', cat: 'education', type: 'expense', cents: 8500, day: '20' },
  ]);

  // Seed September 2026
  seedMonthTransactions(userId, '2026-09', [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income', cents: 650000, day: '01' },
    { desc: 'Freelance Consulting Payout', cat: 'freelance', type: 'income', cents: 150000, day: '18' },
    { desc: 'Dividend Reinvestment', cat: 'investments', type: 'income', cents: 45000, day: '25' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense', cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Electric Utility', cat: 'utilities', type: 'expense', cents: 23000, day: '05' },
    { desc: 'Trader Joe & Whole Foods', cat: 'food', type: 'expense', cents: 33500, day: '09' },
    { desc: 'Fine Dining & Sushi Dinner', cat: 'food', type: 'expense', cents: 18000, day: '22' },
    { desc: 'Metro Transit & Rideshare', cat: 'transportation', type: 'expense', cents: 14500, day: '12' },
    { desc: 'Dental Cleaning & Preventive Care', cat: 'healthcare', type: 'expense', cents: 11000, day: '16' },
    { desc: 'Streaming Services & Concert', cat: 'entertainment', type: 'expense', cents: 16500, day: '24' },
    { desc: 'Workstation Accessories', cat: 'shopping', type: 'expense', cents: 24000, day: '19' },
  ]);

  // Seed October 2026 (Current Active Month)
  seedMonthTransactions(userId, '2026-10', [
    { desc: 'TechCorp Senior Salary', cat: 'salary', type: 'income', cents: 650000, day: '01' },
    { desc: 'Freelance Advisory Payout', cat: 'freelance', type: 'income', cents: 140000, day: '12' },
    { desc: 'Luxury Apartment Rent', cat: 'housing', type: 'expense', cents: 180000, day: '02' },
    { desc: 'Fiber Internet & Power Utility', cat: 'utilities', type: 'expense', cents: 24000, day: '04' },
    { desc: 'Gourmet Groceries & Organic Market', cat: 'food', type: 'expense', cents: 39500, day: '06' },
    { desc: 'Omakase Dinner with Team', cat: 'food', type: 'expense', cents: 22000, day: '11' },
    { desc: 'Artisanal Cafe & Bakery', cat: 'food', type: 'expense', cents: 8500, day: '17' },
    { desc: 'Transit Pass & Rideshare', cat: 'transportation', type: 'expense', cents: 13500, day: '08' },
    { desc: 'Prescription & Vitamins', cat: 'healthcare', type: 'expense', cents: 9500, day: '14' },
    { desc: 'Symphony Hall Tickets', cat: 'entertainment', type: 'expense', cents: 14000, day: '15' },
    { desc: 'Mechanical Keyboard Upgrade', cat: 'shopping', type: 'expense', cents: 28500, day: '09' },
    { desc: 'Professional Cloud Certification Exam', cat: 'education', type: 'expense', cents: 30000, day: '18' },
  ]);

  // Seed Budgets for October 2026
  // Includes On Track, Near Limit, and Over Budget categories
  const insertBudget = db.prepare(`
    INSERT INTO budgets (id, user_id, category, month_key, limit_cents, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Housing: $1,800 limit, spent $1,800 -> 100% on track
  insertBudget.run(uuidv4(), userId, 'housing', '2026-10', 180000, now, now);
  // Food & Dining: $500 limit, spent $700 ($395 + $220 + $85 = $700) -> 140% OVER BUDGET!
  insertBudget.run(uuidv4(), userId, 'food', '2026-10', 50000, now, now);
  // Utilities: $270 limit, spent $240 -> 88.9% NEAR LIMIT!
  insertBudget.run(uuidv4(), userId, 'utilities', '2026-10', 27000, now, now);
  // Transportation: $180 limit, spent $135 -> 75% ON TRACK
  insertBudget.run(uuidv4(), userId, 'transportation', '2026-10', 18000, now, now);
  // Shopping: $300 limit, spent $285 -> 95% NEAR LIMIT!
  insertBudget.run(uuidv4(), userId, 'shopping', '2026-10', 30000, now, now);
  // Entertainment: $250 limit, spent $140 -> 56% ON TRACK
  insertBudget.run(uuidv4(), userId, 'entertainment', '2026-10', 25000, now, now);

  return { userId };
}

function seedMonthTransactions(
  userId: string,
  monthKey: string,
  items: Array<{ desc: string; cat: string; type: 'income' | 'expense'; cents: number; day: string }>
) {
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, user_id, amount_cents, type, category, occurrence_date, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const item of items) {
    const txId = uuidv4();
    const occurrenceDate = `${monthKey}-${item.day}`;
    insertTx.run(txId, userId, item.cents, item.type, item.cat, occurrenceDate, item.desc, now, now);
  }
}

if (require.main === module) {
  const res = seedDemoWorkspace();
  console.log('✅ Demo workspace seeded successfully for user ID:', res.userId);
}
