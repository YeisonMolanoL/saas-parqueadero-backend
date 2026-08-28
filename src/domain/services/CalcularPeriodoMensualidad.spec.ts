import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularPeriodoRenovado, calcularPrimerPeriodoMensualidad } from './CalcularPeriodoMensualidad.js';

test('calcula el primer vencimiento en el día de pago pactado', () => {
    const periodo = calcularPrimerPeriodoMensualidad(new Date(2026, 7, 27), 5);

    assert.deepEqual(periodo.fechaInicio, new Date(2026, 7, 27));
    assert.deepEqual(periodo.fechaVencimiento, new Date(2026, 8, 5));
});

test('ajusta el día 30 al último día de febrero no bisiesto', () => {
    const periodo = calcularPrimerPeriodoMensualidad(new Date(2026, 0, 30), 30);

    assert.deepEqual(periodo.fechaVencimiento, new Date(2026, 1, 28));
});

test('ajusta el día 30 al 29 de febrero bisiesto', () => {
    const periodo = calcularPrimerPeriodoMensualidad(new Date(2028, 0, 30), 30);

    assert.deepEqual(periodo.fechaVencimiento, new Date(2028, 1, 29));
});

test('renueva desde el vencimiento cuando el cliente paga anticipadamente', () => {
    const periodo = calcularPeriodoRenovado(new Date(2026, 8, 5), new Date(2026, 8, 1), 5);

    assert.deepEqual(periodo.fechaInicio, new Date(2026, 8, 5));
    assert.deepEqual(periodo.fechaVencimiento, new Date(2026, 9, 5));
});

test('mantiene el día de pago pactado al renovar una mensualidad vencida', () => {
    const periodo = calcularPeriodoRenovado(new Date(2026, 7, 5), new Date(2026, 8, 20), 5);

    assert.deepEqual(periodo.fechaInicio, new Date(2026, 8, 20));
    assert.deepEqual(periodo.fechaVencimiento, new Date(2026, 9, 5));
});