import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';

console.log(`[INFO] [DB] Inicializando cliente de DynamoDB en la región: ${region}`);

const client = new DynamoDBClient({ region });

export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, 
    convertClassInstanceToMap: true,
  },
});