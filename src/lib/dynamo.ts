import { DynamoDB } from 'aws-sdk';
import { Configuration, DocumentNotFoundError } from '../public';

export const dynamo = new DynamoDB.DocumentClient();

export async function putItem (tableName: string, documentName: string, data: any): Promise<void> {
  await dynamo.put({
    TableName: tableName,
    Item: { configName: documentName, data },
  }).promise();
}

export async function updatePartialItem (tableName: string, documentName: string, key: string | string[], data: object): Promise<object> {
  const paths = Array.isArray(key) ? ['data', ...key] : ('data.' + key).split('.');
  const updateExpression = `SET ${paths.map((subPath, index) => '#path' + index).join('.')} = :data`;
  const updateKeys: Record<string, string> = {};
  paths.forEach((subPath, index) => updateKeys['#path' + index] = subPath);

  const response = await dynamo.update({
    TableName: tableName,
    Key: { configName: documentName },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: updateKeys,
    ExpressionAttributeValues: { ':data': data },
    ReturnValues: 'ALL_NEW',
  }).promise();
  return (response.Attributes as Configuration).data;
}

export async function getItem (tableName: string, documentName: string): Promise<object> {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { configName: documentName },
    ProjectionExpression: '#data',
    ExpressionAttributeNames: { '#data': 'data' },
  }).promise();
  if (response.Item === undefined) {
    throw new DocumentNotFoundError(`Request resource ${documentName} not found`);
  }
  return (response.Item as Configuration).data;
}

export async function deleteItem (tableName: string, documentName: string): Promise<void> {
  await dynamo.delete({
    TableName: tableName,
    Key: { configName: documentName },
  }).promise();
}

export async function deletePartialItem (tableName: string, documentName: string, key: string | string[]): Promise<object> {
  const paths = Array.isArray(key) ? ['data', ...key] : ('data.' + key).split('.');
  const updateExpression = `REMOVE ${paths.map((subPath, index) => '#path' + index).join('.')}`;
  const updateKeys: Record<string, string> = {};
  paths.forEach((subPath, index) => updateKeys['#path' + index] = subPath);

  const response = await dynamo.update({
    TableName: tableName,
    Key: { configName: documentName },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: updateKeys,
    ReturnValues: 'ALL_NEW',
  }).promise();
  return (response.Attributes as Configuration).data;
}
