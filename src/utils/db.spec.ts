import { describe, it, expect, vi } from 'vitest';
import { dynamoDb } from './db.js';

describe('Pruebas unitarias para db.ts', () => {
  it('Debería exportar el cliente dynamoDb correctamente inicializado', () => {
    expect(dynamoDb).toBeDefined();
    expect(dynamoDb.send).toBeTypeOf('function');
  });
});