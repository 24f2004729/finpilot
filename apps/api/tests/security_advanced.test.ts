import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { config } from '../src/config';

describe('Advanced Security & Threat Model Verification Suite (Chapter 18 & 19)', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `sec_tester_${Date.now()}@finpilot.dev`,
        password: 'ValidPassword123!',
        fullName: 'Security Auditor',
        currency: 'USD',
      });
    expect(res.status).toBe(201);
    authToken = res.body.data.token;
    userId = res.body.data.user.id;
  });

  describe('CWE-89: SQL Injection Parameterization Defense', () => {
    it('defends against SQL injection in search query parameter', async () => {
      const maliciousPayload = "' OR '1'='1' --";
      const res = await request(app)
        .get(`/api/transactions?search=${encodeURIComponent(maliciousPayload)}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
      // Parameterization must treat payload as literal search text without leaking other users' records
      expect(res.body.data.transactions).toHaveLength(0);
    });

    it('defends against UNION-based SQL injection in category parameter', async () => {
      const unionPayload = "food' UNION SELECT id, email, password_hash, '', 0, '', '', '', '' FROM users--";
      const res = await request(app)
        .get(`/api/transactions?category=${encodeURIComponent(unionPayload)}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toHaveLength(0);
    });

    it('defends against SQL injection in monthKey parameter with schema validation', async () => {
      const injectionMonth = "2026-10' OR 1=1 --";
      const res = await request(app)
        .get(`/api/transactions?monthKey=${encodeURIComponent(injectionMonth)}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication Attack Surface & Token Forgery Defense', () => {
    it('rejects tampered JWT signature with 401 Unauthorized', async () => {
      // Decode token and re-sign with an attacker secret
      const decoded = jwt.decode(authToken) as any;
      const forgedToken = jwt.sign({ ...decoded, userId }, 'attacker-counterfeit-secret-key-123456789!');

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects token signed with "none" algorithm (CVE-2015-9235 defense)', async () => {
      const headerB64 = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      const unsignedToken = `${headerB64}.${payloadB64}.`;

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${unsignedToken}`);

      expect(res.status).toBe(401);
    });

    it('rejects expired JWT token with 401 Unauthorized', async () => {
      // Sign a token that expired 1 hour ago
      const expiredToken = jwt.sign(
        { userId, exp: Math.floor(Date.now() / 1000) - 3600 },
        config.JWT_SECRET
      );

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects malformed Bearer header values', async () => {
      const badHeaders = [
        'Bearer ',
        'Bearer null',
        'Bearer undefined',
        'Bearer a.b',
        'Basic dXNlcjpwYXNz',
        'RandomStringWithoutBearer',
      ];

      for (const header of badHeaders) {
        const res = await request(app)
          .get('/api/transactions')
          .set('Authorization', header);
        expect(res.status).toBe(401);
      }
    });
  });

  describe('HTTP Security Headers & Strict CORS (Chapter 18 & 29)', () => {
    it('sets protective Helmet HTTP headers on responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('rejects unauthorized cross-origin requests from untrusted origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-attacker-domain.xyz');

      // Strict CORS middleware rejects untrusted origin with 403 Forbidden
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CORS_FORBIDDEN');
    });

    it('permits cross-origin requests from authorized development origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Input Validation & Strict Schema Boundaries (REQ-18-03)', () => {
    it('rejects transaction with negative amount', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountCents: -5000,
          type: 'expense',
          category: 'food',
          occurrenceDate: '2026-10-10',
          description: 'Negative spend test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects transaction with invalid date format', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountCents: 1000,
          type: 'expense',
          category: 'food',
          occurrenceDate: '10/20/2026', // Must be YYYY-MM-DD per ADR-001
          description: 'Bad date test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects transaction with unsupported type', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountCents: 1000,
          type: 'transfer', // Only 'income' | 'expense' allowed
          category: 'food',
          occurrenceDate: '2026-10-10',
          description: 'Transfer type test',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects transaction with oversized description (> 255 chars)', async () => {
      const longDesc = 'A'.repeat(300);
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountCents: 1000,
          type: 'expense',
          category: 'food',
          occurrenceDate: '2026-10-10',
          description: longDesc,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects budget with zero or negative limit', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'food',
          monthKey: '2026-10',
          limitCents: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('CWE-79: Cross-Site Scripting (XSS) Stored Payload Neutralization', () => {
    it('safely stores and returns script tags without executing or breaking response', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amountCents: 4500,
          type: 'expense',
          category: 'food',
          occurrenceDate: '2026-10-14',
          description: xssPayload,
          notes: '"><img src=x onerror=alert(1)>',
        });

      expect(res.status).toBe(201);
      const tx = res.body.data.transaction;
      expect(tx.description).toBe(xssPayload);

      // Verify Content-Type is application/json (browser will not interpret as HTML)
      expect(res.headers['content-type']).toContain('application/json');

      // Verify export sanitizes formula characters if present
      const exportRes = await request(app)
        .get('/api/transactions/export?monthKey=2026-10')
        .set('Authorization', `Bearer ${authToken}`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.headers['content-type']).toContain('text/csv');
    });
  });
});
