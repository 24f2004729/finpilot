import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { config } from '../config';
import { RegisterSchema, LoginSchema, DEMO_USER_EMAIL, User } from '@finpilot/shared';
import { seedDemoWorkspace } from '../db/seed';

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  static async register(data: typeof RegisterSchema._type): Promise<{ user: User; token: string }> {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, currency, is_demo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(userId, data.email.toLowerCase(), passwordHash, data.fullName, data.currency, now, now);

    const user: User = {
      id: userId,
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      currency: data.currency,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    };

    const token = this.generateToken(userId);
    return { user, token };
  }

  static async login(data: typeof LoginSchema._type): Promise<{ user: User; token: string }> {
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email.toLowerCase()) as any;
    
    // Generic error to prevent user enumeration
    if (!userRow) {
      throw new Error('Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(data.password, userRow.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid email or password.');
    }

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      currency: userRow.currency,
      isDemo: Boolean(userRow.is_demo),
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    };

    const token = this.generateToken(userRow.id);
    return { user, token };
  }

  static getDemoAccount(): { user: User; token: string } {
    let demoRow = db.prepare('SELECT * FROM users WHERE email = ?').get(DEMO_USER_EMAIL) as any;

    if (!demoRow) {
      const { userId } = seedDemoWorkspace();
      demoRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    }

    const user: User = {
      id: demoRow.id,
      email: demoRow.email,
      fullName: demoRow.full_name,
      currency: demoRow.currency,
      isDemo: true,
      createdAt: demoRow.created_at,
      updatedAt: demoRow.updated_at,
    };

    const token = this.generateToken(demoRow.id);
    return { user, token };
  }
}
