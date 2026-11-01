import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSummary, parseDecimal } from './calc.js';

test('menghitung potongan, netto, dan total bayar', () => {
  const r = calculateSummary([21.3, 22, 20.7], 1.5, 25000);
  assert.deepEqual(r, {
    count: 3,
    totalGross: 64,
    totalDeduction: 4.5,
    totalNet: 59.5,
    totalAmount: 1487500,
  });
});

test('tidak ada selisih floating point', () => {
  const r = calculateSummary([0.1, 0.2], 0, 1);
  assert.equal(r.totalGross, 0.3);
  assert.equal(calculateSummary([10.1, 10.2, 10.3], 1.1, 33333).totalAmount, 909990.9);
});

test('daftar kosong menghasilkan nol', () => {
  assert.deepEqual(calculateSummary([], 1.5, 25000), {
    count: 0, totalGross: 0, totalDeduction: 0, totalNet: 0, totalAmount: 0,
  });
});

test('netto bisa negatif jika berat ember salah (divalidasi terpisah)', () => {
  assert.equal(calculateSummary([1], 2, 1000).totalNet, -1);
});

test('parseDecimal menerima koma dan titik', () => {
  assert.equal(parseDecimal('21,3'), 21.3);
  assert.equal(parseDecimal(' 21.3 '), 21.3);
  assert.equal(parseDecimal(5), 5);
  assert.ok(Number.isNaN(parseDecimal('')));
  assert.ok(Number.isNaN(parseDecimal('abc')));
  assert.ok(Number.isNaN(parseDecimal('1.2.3')));
});
