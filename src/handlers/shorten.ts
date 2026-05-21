import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../utils/db.js';
import { generateShortCode } from '../utils/generator.js';

const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('[INFO] [HANDLER] Petición recibida en POST /shorten');

  try {
    if (!TABLE_NAME) {
      console.error('[ERROR] [HANDLER] La variable de entorno TABLE_NAME no está configurada');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuración interna del servidor incompleta' }),
      };
    }

    if (!event.body) {
      console.warn('[WARN] [HANDLER] Petición recibida sin cuerpo (body)');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El cuerpo de la petición es obligatorio' }),
      };
    }

    const { longUrl } = JSON.parse(event.body);

    if (!longUrl || typeof longUrl !== 'string') {
      console.warn('[WARN] [HANDLER] URL larga inválida o ausente');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El campo longUrl es obligatorio y debe ser un texto' }),
      };
    }

    try {
      new URL(longUrl);
    } catch {
      console.warn(`[WARN] [HANDLER] Formato de URL inválido: ${longUrl}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El formato de longUrl no corresponde a una URL válida' }),
      };
    }

    const shortCode = generateShortCode();
    const createdAt = new Date().toISOString();

    const item = {
      shortCode,
      longUrl,
      createdAt,
      clickCount: 0,
    };

    console.log(`[INFO] [HANDLER] Intentando guardar código [${shortCode}] para la URL: ${longUrl}`);

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    console.log(`[INFO] [HANDLER] Registro guardado con éxito en DynamoDB: ${shortCode}`);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'URL acortada exitosamente',
        shortCode,
        longUrl,
        shortUrl: `https://${event.requestContext.domainName || 'miweb.com'}/${shortCode}`,
      }),
    };
  } catch (error) {
    console.error('[ERROR] [HANDLER] Error inesperado en el handler de acortamiento', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ocurrió un error interno al procesar la solicitud' }),
    };
  }
};