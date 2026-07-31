// @vitest-environment node
import { describe, expect, it } from 'vitest';
import enDict from '@/data/dictionaries/en.json';
import esDict from '@/data/dictionaries/es.json';
import frDict from '@/data/dictionaries/fr.json';

/**
 * Recursively collects the leaf keys of a JSON object as dot-paths.
 * E.g. { dashboard: { nav: { dashboard: 'x' } } } -> ['dashboard.nav.dashboard']
 */
function collectLeafKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const record = obj as Record<string, unknown>;
  return Object.keys(record).flatMap((key) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    return collectLeafKeys(record[key], newPrefix);
  });
}

function leafKeysByPrefix(obj: unknown, prefix: string): string[] {
  return collectLeafKeys(obj).filter((k) => k.startsWith(prefix + '.'));
}

describe('dictionary parity (T18 → R2)', () => {
  const esDashboard = (esDict as { dashboard: unknown }).dashboard;
  const enDashboard = (enDict as { dashboard: unknown }).dashboard;
  const frDashboard = (frDict as { dashboard: unknown }).dashboard;

  it('all 3 dictionaries contain a dashboard section', () => {
    expect(esDashboard).toBeDefined();
    expect(enDashboard).toBeDefined();
    expect(frDashboard).toBeDefined();
  });

  it('es/en/fr dashboard sections have the same set of top-level keys', () => {
    const esTop = Object.keys(esDashboard as object).sort();
    const enTop = Object.keys(enDashboard as object).sort();
    const frTop = Object.keys(frDashboard as object).sort();

    expect(enTop).toEqual(esTop);
    expect(frTop).toEqual(esTop);
  });

  it('es/en/fr have identical leaf keys under dashboard.*', () => {
    const esLeaves = collectLeafKeys(esDashboard).sort();
    const enLeaves = collectLeafKeys(enDashboard).sort();
    const frLeaves = collectLeafKeys(frDashboard).sort();

    expect(enLeaves).toEqual(esLeaves);
    expect(frLeaves).toEqual(esLeaves);
  });

  it('es/en/fr share the same keys under dashboard.property_form', () => {
    const esLeaves = leafKeysByPrefix(esDashboard, 'property_form').sort();
    const enLeaves = leafKeysByPrefix(enDashboard, 'property_form').sort();
    const frLeaves = leafKeysByPrefix(frDashboard, 'property_form').sort();

    expect(enLeaves).toEqual(esLeaves);
    expect(frLeaves).toEqual(esLeaves);
  });

  it('es/en/fr share the same keys under dashboard.users_list', () => {
    const esLeaves = leafKeysByPrefix(esDashboard, 'users_list').sort();
    const enLeaves = leafKeysByPrefix(enDashboard, 'users_list').sort();
    const frLeaves = leafKeysByPrefix(frDashboard, 'users_list').sort();

    expect(enLeaves).toEqual(esLeaves);
    expect(frLeaves).toEqual(esLeaves);
  });

  it('es/en/fr share the same keys under dashboard.properties_list', () => {
    const esLeaves = leafKeysByPrefix(esDashboard, 'properties_list').sort();
    const enLeaves = leafKeysByPrefix(enDashboard, 'properties_list').sort();
    const frLeaves = leafKeysByPrefix(frDashboard, 'properties_list').sort();

    expect(enLeaves).toEqual(esLeaves);
    expect(frLeaves).toEqual(esLeaves);
  });

  it('dashboard.nav exists in all 3 locales with same 4 keys', () => {
    const esNav = (
      esDashboard as { nav: Record<string, string> }
    ).nav;
    const enNav = (
      enDashboard as { nav: Record<string, string> }
    ).nav;
    const frNav = (
      frDashboard as { nav: Record<string, string> }
    ).nav;

    expect(Object.keys(esNav).sort()).toEqual(
      ['administrator', 'dashboard', 'properties', 'users'],
    );
    expect(Object.keys(enNav).sort()).toEqual(
      Object.keys(esNav).sort(),
    );
    expect(Object.keys(frNav).sort()).toEqual(
      Object.keys(esNav).sort(),
    );
  });

  it('all values in dashboard.nav are non-empty strings in all 3 locales', () => {
    for (const dict of [esDashboard, enDashboard, frDashboard] as Array<{
      nav: Record<string, string>;
    }>) {
      for (const [key, value] of Object.entries(dict.nav)) {
        expect(typeof value, `nav.${key}`).toBe('string');
        expect(value.length, `nav.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
