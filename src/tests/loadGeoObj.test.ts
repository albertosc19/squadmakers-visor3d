import { describe, expect, it } from 'vitest';
import { normalizeObjNumericFormat } from '../loaders/loadGeoObj';

describe('normalizeObjNumericFormat', () => {
  it('replaces decimal commas in vertex lines', () => {
    const raw = `v 690758,53 4183382,91 722,55\nvn 1,0 0,0 0,0\nf 1 2 3`;

    const normalized = normalizeObjNumericFormat(raw);

    expect(normalized).toContain('v 690758.53 4183382.91 722.55');
    expect(normalized).toContain('vn 1.0 0.0 0.0');
    expect(normalized).toContain('f 1 2 3');
  });
});
