import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

// Creamos una función espía controlable para randomBytes
const mockRandomBytes = vi.fn().mockReturnValue(Buffer.from('1234567890abcdef'));

// Mockeamos el módulo completo antes de que se importe tu generator
vi.mock('crypto', () => ({
  default: {
    randomBytes: (size: number) => mockRandomBytes(size)
  },
  randomBytes: (size: number) => mockRandomBytes(size)
}));

// Ahora importamos de forma segura tu generador
import { generateShortCode } from './generator.js';

describe('Pruebas unitarias para generator.ts', () => {
  
  it('Debería generar un código de la longitud por defecto de 6 caracteres', () => {
    mockRandomBytes.mockReturnValueOnce(Buffer.from('abcdef'));
    const code = generateShortCode();
    expect(code).toBeTypeOf('string');
    expect(code.length).toBe(6);
  });

  it('Debería respetar una longitud personalizada si se le envía por parámetro', () => {
    mockRandomBytes.mockReturnValueOnce(Buffer.from('abcdefghij'));
    const length = 10;
    const code = generateShortCode(length);
    expect(code.length).toBe(length);
  });

  it('Debería generar códigos únicos en llamadas consecutivas', () => {
    mockRandomBytes.mockReturnValueOnce(Buffer.from('abcdeg')).mockReturnValueOnce(Buffer.from('hijklm'));
    const code1 = generateShortCode();
    const code2 = generateShortCode();
    expect(code1).not.toBe(code2);
  });

  it('Debería lanzar un error si el método randomBytes falla', () => {
    // Forzamos al espía a arrojar una excepción simulada
    mockRandomBytes.mockImplementationOnce(() => {
      throw new Error('Crypto error simulation');
    });

    expect(() => generateShortCode()).toThrow('Error al generar el identificador único');
  });
});