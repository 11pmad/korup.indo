import { describe, expect, it } from 'vitest';
import { calculateAntiDoubleCounting } from '@/server/services/financials';
import { INDONESIA_PROVINCES_GEO } from '@/data/provincesGeo';
import { resolveProvinceId } from '@/lib/provinces';
import { adminCaseCreateSchema, safeExternalUrlSchema } from '@/server/validators';
import { hasAdminPermission, signAdminSession, verifyAdminToken } from '@/server/auth';

describe('LKI v2.0 Core Invariants', () => {
  it('enforces Anti-Double-Counting hierarchy and excludes project_value/contract_value', () => {
    const res = calculateAntiDoubleCounting(
      [
        { financial_type: 'project_value', amount: 28_000_000_000_000 },
        { financial_type: 'contract_value', amount: 15_000_000_000_000 },
        { financial_type: 'court_recognized_loss_amount', amount: 8_030_000_000_000 },
        { financial_type: 'audit_loss_amount', amount: 8_100_000_000_000 },
        { financial_type: 'bribe_amount', amount: 50_000_000_000 },
        { financial_type: 'restitution_amount', amount: 1_000_000_000_000 },
        { financial_type: 'fine_amount', amount: 1_000_000_000 },
        { financial_type: 'assets_seized_value', amount: 500_000_000_000 },
      ],
      'divonis_inkrah'
    );

    expect(res.displayLossAmount).toBe(8_030_000_000_000);
    expect(res.displayLossBasis).toBe('Putusan Pengadilan');
    expect(res.displayBribeAmount).toBe(50_000_000_000);
    expect(res.displayRecoveryAmount).toBe(1_501_000_000_000);
  });

  it('resolves all 38 GeoJSON polygons to 38 distinct province slugs without collisions', () => {
    expect(INDONESIA_PROVINCES_GEO.length).toBe(38);
    const resolved = INDONESIA_PROVINCES_GEO.map((p) => resolveProvinceId(p.name));
    expect(new Set(resolved).size).toBe(38);
    expect(resolved.every((id) => id !== 'nasional')).toBe(true);
  });

  it('rejects private/localhost SSRF URLs and enforces decision number for divonis_inkrah', () => {
    expect(safeExternalUrlSchema.safeParse('http://127.0.0.1:8080/admin').success).toBe(false);
    expect(safeExternalUrlSchema.safeParse('http://localhost/secret').success).toBe(false);
    expect(safeExternalUrlSchema.safeParse('https://putusan3.mahkamahagung.go.id/direktori/putusan/123').success).toBe(true);

    const missingVerdictNum = adminCaseCreateSchema.safeParse({
      caseTitle: 'Perkara Uji Validasi Putusan Inkrah',
      eraId: 'era-prabowo',
      primaryProvinceId: 'dki-jakarta',
      sectorCategory: 'pengadaan_barang_jasa',
      sectorLabel: 'Pengadaan Barang/Jasa',
      primaryMode: 'Mark-up',
      currentLegalStatus: 'divonis_inkrah',
      summary: 'Ringkasan perkara uji validasi minimal dua puluh lima karakter.',
      personName: 'Subjek Uji',
      personPosition: 'Pejabat Uji',
      financialType: 'court_recognized_loss_amount',
      amount: 1000000000,
      sourceTitle: 'Direktori Putusan MA',
      sourceUrl: 'https://putusan3.mahkamahagung.go.id/direktori/putusan/123',
      sourceInstitution: 'Mahkamah Agung RI',
      sourceExcerpt: 'Menjatuhkan pidana penjara berdasarkan putusan berkekuatan hukum tetap.',
    });
    expect(missingVerdictNum.success).toBe(false);
  });

  it('enforces RBAC permissions and signs/verifies jose admin JWT tokens', async () => {
    expect(hasAdminPermission('editor', 'manage_cases')).toBe(true);
    expect(hasAdminPermission('editor', 'delete_cases')).toBe(false);
    expect(hasAdminPermission('auditor', 'view_audit_logs')).toBe(true);
    expect(hasAdminPermission('super_admin', 'manage_users')).toBe(true);

    const token = await signAdminSession({
      id: 'adm-test',
      username: 'tester',
      fullName: 'Tester',
      role: 'editor',
    });
    const decoded = await verifyAdminToken(token);
    expect(decoded?.username).toBe('tester');
    expect(decoded?.role).toBe('editor');
  });
});
