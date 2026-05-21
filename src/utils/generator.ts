import { randomBytes } from 'crypto';

export function generateShortCode(length: number = 6): string {
  try {
    const code = randomBytes(length)
      .toString('base64url')
      .substring(0, length);
    
    console.log(`[INFO] [GENERATOR] Código generado exitosamente: ${code}`);
    return code;
  } catch (error) {
    console.error('[ERROR] [GENERATOR] Falló la generación del código corto', error);
    throw new Error('Error al generar el identificador único');
  }
}