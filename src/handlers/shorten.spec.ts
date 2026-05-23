import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';

vi.mock('../utils/db.js', () => ({
  dynamoDb: {
    send: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../utils/generator.js', () => ({
  generateShortCode: vi.fn().mockReturnValue('mockedCode123')
}));

describe('Pruebas unitarias para Shorten Handler (Módulo 1)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv('TABLE_NAME', 'ShortenLinksDB');
  });

  const createMockEvent = (bodyContent: string | null): Partial<APIGatewayProxyEvent> => ({
    body: bodyContent,
    requestContext: {
      domainName: 'miapi.execute-api.com',
    } as any
  });

  it('Debería retornar 201 y crear el enlace acortado exitosamente', async () => {
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const dbModule = await import(new URL('../utils/db.js', import.meta.url).pathname) as any;

    const event = createMockEvent(JSON.stringify({ longUrl: 'https://youtube.com/mi-video-interesante' }));
    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(201);
    expect(result.headers?.['Content-Type']).toBe('application/json');
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('URL acortada exitosamente');
    expect(body.shortCode).toBe('mockedCode123');
    expect(body.longUrl).toBe('https://youtube.com/mi-video-interesante');
    expect(body.shortUrl).toBe('https://miapi.execute-api.com/mockedCode123');
    expect(dbModule.dynamoDb.send).toHaveBeenCalledTimes(1);
  });

  it('Debería retornar 400 si el cuerpo (body) de la petición está vacío', async () => {
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const event = createMockEvent(null);

    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('El cuerpo de la petición es obligatorio');
  });

  it('Debería retornar 400 si longUrl no es enviado en el JSON', async () => {
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const event = createMockEvent(JSON.stringify({}));

    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('El campo longUrl es obligatorio');
  });

  it('Debería retornar 400 si longUrl no tiene un formato de URL válido', async () => {
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const event = createMockEvent(JSON.stringify({ longUrl: 'url-invalida-no-web' }));

    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('El formato de longUrl no corresponde a una URL válida');
  });

  it('Debería retornar 500 si ocurre un fallo inesperado al escribir en DynamoDB', async () => {
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const dbModule = await import(new URL('../utils/db.js', import.meta.url).pathname) as any;
    
    vi.spyOn(dbModule.dynamoDb, 'send').mockRejectedValueOnce(new Error('DynamoDB Crash'));
    const event = createMockEvent(JSON.stringify({ longUrl: 'https://github.com' }));

    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toContain('Ocurrió un error interno al procesar la solicitud');
  });

  it('Debería retornar 500 si la variable de entorno TABLE_NAME no existe', async () => {
    vi.unstubAllEnvs(); 
    
    const handlerModule = await import(new URL('./shorten.js', import.meta.url).pathname) as any;
    const event = createMockEvent(JSON.stringify({ longUrl: 'https://google.com' }));

    const result = await handlerModule.handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toContain('Configuración interna del servidor incompleta');
  });
});