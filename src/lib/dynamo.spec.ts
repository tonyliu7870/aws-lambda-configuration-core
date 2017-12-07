import * as db from './dynamo';
import { DocumentNotFoundError } from '../public';

describe('dynamo functions', async () => {
  describe('#putItem', async () => {
    it('should forward put request to dynamo', async () => {
      spyOn(db.dynamo, 'put').and.callFake((param: AWS.DynamoDB.DocumentClient.PutItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Item.configName).toBe('my-document');
        expect(param.Item.data).toEqual(jasmine.objectContaining({ hello: 'world' }));
        return { promise: () => Promise.resolve() };
      });
      await db.putItem('my-table', 'my-document', { hello: 'world' });
    });
  });

  describe('#updateItem', async () => {
    it('should update item (string key)', async () => {
      spyOn(db.dynamo, 'update').and.callFake((param: AWS.DynamoDB.DocumentClient.UpdateItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        expect(param.UpdateExpression).toBe('SET #path0.#path1.#path2 = :data');
        expect(param.ExpressionAttributeNames).toEqual(<any>jasmine.objectContaining({
          '#path0': 'data',
          '#path1': 'path1',
          '#path2': 'path2',
        }));
        expect(param.ExpressionAttributeValues).toEqual(<any>jasmine.objectContaining({
          ':data': { hello: 'world' }
        }));
        expect(param.ReturnValues).toBe('ALL_NEW');
        const result = { data: true };
        return { promise: () => Promise.resolve({ Attributes: result }) };
      });
      const result = await db.updatePartialItem('my-table', 'my-document', 'path1.path2', { hello: 'world' });
      expect(result).toBeTruthy();
    });

    it('should update item (array key)', async () => {
      spyOn(db.dynamo, 'update').and.callFake((param: AWS.DynamoDB.DocumentClient.UpdateItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        expect(param.UpdateExpression).toBe('SET #path0.#path1.#path2 = :data');
        expect(param.ExpressionAttributeNames).toEqual(<any>jasmine.objectContaining({
          '#path0': 'data',
          '#path1': 'path1',
          '#path2': 'path2a.path2b',
        }));
        expect(param.ExpressionAttributeValues).toEqual(<any>jasmine.objectContaining({
          ':data': { hello: 'world' }
        }));
        expect(param.ReturnValues).toBe('ALL_NEW');
        const result = { data: true };
        return { promise: () => Promise.resolve({ Attributes: result }) };
      });
      const result = await db.updatePartialItem('my-table', 'my-document', ['path1', 'path2a.path2b'], { hello: 'world' });
      expect(result).toBeTruthy();
    });
  });

  describe('#getItem', async () => {
    it('should get item', async () => {
      spyOn(db.dynamo, 'get').and.callFake((param: AWS.DynamoDB.DocumentClient.GetItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        expect(param.ProjectionExpression).toBe('#data');
        expect(param.ExpressionAttributeNames).toEqual(<any>jasmine.objectContaining({
          '#data': 'data',
        }));
        const result = { data: true };
        return { promise: () => Promise.resolve({ Item: result }) };
      });
      const result = await db.getItem('my-table', 'my-document');
      expect(result).toBeTruthy();
    });

    it('should throw error for not exist item', async () => {
      spyOn(db.dynamo, 'get').and.callFake((param: AWS.DynamoDB.DocumentClient.GetItemInput) => {
        return { promise: () => Promise.resolve({}) };
      });
      try {
        await db.getItem('my-table', 'abcde');
      } catch (error) {
        expect(error instanceof DocumentNotFoundError).toBeTruthy();
      }
    });
  });

  describe('#deleteItem', async () => {
    it('should forward delete request to dynamo', async () => {
      spyOn(db.dynamo, 'delete').and.callFake((param: AWS.DynamoDB.DocumentClient.GetItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        return { promise: () => Promise.resolve() };
      });
      await db.deleteItem('my-table', 'my-document');
    });
  });

  describe('#deletePartialItem', async () => {
    it('should delete item (string key)', async () => {
      spyOn(db.dynamo, 'update').and.callFake((param: AWS.DynamoDB.DocumentClient.UpdateItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        expect(param.UpdateExpression).toBe('REMOVE #path0.#path1.#path2');
        expect(param.ExpressionAttributeNames).toEqual(<any>jasmine.objectContaining({
          '#path0': 'data',
          '#path1': 'path1',
          '#path2': 'path2',
        }));
        expect(param.ReturnValues).toBe('ALL_NEW');
        const result = { data: true };
        return { promise: () => Promise.resolve({ Attributes: result }) };
      });
      const result = await db.deletePartialItem('my-table', 'my-document', 'path1.path2');
      expect(result).toBeTruthy();
    });

    it('should delete item (array key)', async () => {
      spyOn(db.dynamo, 'update').and.callFake((param: AWS.DynamoDB.DocumentClient.UpdateItemInput) => {
        expect(param.TableName).toBe('my-table');
        expect(param.Key).toEqual(jasmine.objectContaining({ configName: 'my-document' }));
        expect(param.UpdateExpression).toBe('REMOVE #path0.#path1.#path2');
        expect(param.ExpressionAttributeNames).toEqual(<any>jasmine.objectContaining({
          '#path0': 'data',
          '#path1': 'path1',
          '#path2': 'path2a.path2b',
        }));
        expect(param.ReturnValues).toBe('ALL_NEW');
        const result = { data: true };
        return { promise: () => Promise.resolve({ Attributes: result }) };
      });
      const result = await db.deletePartialItem('my-table', 'my-document', ['path1', 'path2a.path2b']);
      expect(result).toBeTruthy();
    });
  });
});
