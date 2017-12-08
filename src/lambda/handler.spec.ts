import { ConfigEvent, CacheNotFoundError, DocumentNotFoundError, TypeNotFoundError } from '../public';

describe('lambda handler', async () => {
  let handler: any;
  beforeEach(() => {
    handler = require('./handler');
  });

  describe('warming event', async () => {
    it('should return directly', async (done) => {
      handler.handler({ 'detail-type': 'Scheduled Event' }, null, done);
    });
  });

  describe('#getConfig', async () => {
    it('should get whole config, no cache', async (done) => {
      const data = { hello: 'world' };
      spyOn(handler.db, 'getItem').and.callFake((tableName: string, documentName: string) => {
        expect(tableName).toBe('lambda-configurations');
        expect(documentName).toBe('settings');
        return Promise.resolve(data);
      });
      await handler.handler(<ConfigEvent>{
        type: 'GET',
        noCache: true,
      }, null, (error: any, result: any) => {
        expect(result).toEqual(data);
        done();
      });
    });

    it('should get whole config, with cache', async (done) => {
      const data = { path1: 'hello world' };
      spyOn(handler.cache, 'getCache').and.callFake((tableName: string, documentName: string, key?: string | string[]) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(key).toBe('path1');
        return data.path1;
      });
      await handler.handler(<ConfigEvent>{
        type: 'GET',
        tableName: 'my-table',
        documentName: 'my-document',
        key: 'path1',
      }, null, (error: any, result: any) => {
        expect(result).toBe('hello world');
        done();
      });
    });

    it('should get whole config, with cache not found', async (done) => {
      const data = { path1: 'hello world' };
      spyOn(handler.cache, 'getCache').and.callFake((tableName: string, documentName: string, key?: string | string[]) => {
        throw new CacheNotFoundError();
      });
      spyOn(handler.cache, 'setCache').and.callFake((tableName: string, documentName: string, document: any) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(document).toBe(data);
      });
      spyOn(handler.db, 'getItem').and.callFake((tableName: string, documentName: string) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        return Promise.resolve(data);
      });
      await handler.handler(<ConfigEvent>{
        type: 'GET',
        tableName: 'my-table',
        documentName: 'my-document',
        key: 'path1',
      }, null, (error: any, result: any) => {
        expect(result).toBe('hello world');
        done();
      });
    });
  });

  describe('#checkConfig', async () => {
    it('should return false for no document', async (done) => {
      const data = { path1: 'hello world' };
      spyOn(handler.cache, 'getCache').and.callFake((tableName: string, documentName: string, key?: string | string[]) => {
        throw new CacheNotFoundError();
      });
      spyOn(handler.db, 'getItem').and.callFake((tableName: string, documentName: string) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        return Promise.reject(new DocumentNotFoundError());
      });
      await handler.handler(<ConfigEvent>{
        type: 'CHECK',
        tableName: 'my-table',
        documentName: 'my-document'
      }, null, (error: any, result: any) => {
        expect(result).toBeFalsy();
        done();
      });
    });
  });

  describe('#setConfig', async () => {
    it('should replace config', async (done) => {
      const data = { path1: 'hello world' };
      const setCacheSpy = spyOn(handler.cache, 'setCache').and.callFake((tableName: string, documentName: string, config: any) => {
        expect(tableName).toBe('lambda-configurations');
        expect(documentName).toBe('settings');
        expect(config).toBe(data);
      });
      const putItemSpy = spyOn(handler.db, 'putItem').and.callFake((tableName: string, documentName: string, config: any) => {
        expect(tableName).toBe('lambda-configurations');
        expect(documentName).toBe('settings');
        expect(config).toBe(data);
      });
      await handler.handler(<ConfigEvent>{
        type: 'PUT',
        data,
      }, null, done);
      expect(setCacheSpy).toHaveBeenCalled();
      expect(putItemSpy).toHaveBeenCalled();
      done();
    });

    it('should update config', async (done) => {
      const setCacheSpy = spyOn(handler.cache, 'setCache').and.callFake((tableName: string, documentName: string, data: any) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(data).toEqual(jasmine.objectContaining({ path1: 'hello world' }));
      });
      const updateItemSpy = spyOn(handler.db, 'updatePartialItem').and.callFake((tableName: string, documentName: string, key: string | string[], data: any) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(key).toBe('path1');
        expect(data).toBe('hello world');
        return Promise.resolve({ path1: 'hello world' });
      });
      await handler.handler(<ConfigEvent>{
        type: 'PUT',
        tableName: 'my-table',
        documentName: 'my-document',
        key: 'path1',
        data: 'hello world',
      }, null, done);
      expect(setCacheSpy).toHaveBeenCalled();
      expect(updateItemSpy).toHaveBeenCalled();
      done();
    });
  });

  describe('#deleteConfig', async () => {
    it('should delete config', async (done) => {
      const deleteCacheSpy = spyOn(handler.cache, 'deleteCache').and.callFake((tableName: string, documentName: string) => {
        expect(tableName).toBe('lambda-configurations');
        expect(documentName).toBe('settings');
      });
      const deleteItemSpy = spyOn(handler.db, 'deleteItem').and.callFake((tableName: string, documentName: string) => {
        expect(tableName).toBe('lambda-configurations');
        expect(documentName).toBe('settings');
      });
      await handler.handler(<ConfigEvent>{
        type: 'DELETE',
      }, null, done);
      expect(deleteCacheSpy).toHaveBeenCalled();
      expect(deleteItemSpy).toHaveBeenCalled();
      done();
    });

    it('should delete document', async (done) => {
      const setCacheSpy = spyOn(handler.cache, 'setCache').and.callFake((tableName: string, documentName: string, config: any) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(config).toEqual(jasmine.objectContaining({ path: 'hello world' }));
      });
      const deleteItemSpy = spyOn(handler.db, 'deletePartialItem').and.callFake((tableName: string, documentName: string, key: string | string[]) => {
        expect(tableName).toBe('my-table');
        expect(documentName).toBe('my-document');
        expect(key).toBe('path1');
        return Promise.resolve({ path: 'hello world' });
      });
      await handler.handler(<ConfigEvent>{
        type: 'DELETE',
        tableName: 'my-table',
        documentName: 'my-document',
        key: 'path1',
      }, null, done);
      expect(setCacheSpy).toHaveBeenCalled();
      expect(deleteItemSpy).toHaveBeenCalled();
      done();
    })
  });

  describe('undefined actions', async () => {
    it('should throw type not found error', async (done) => {
      handler.handler({ type: 'hello' }, null, (error: Error) => {
        expect(error instanceof TypeNotFoundError).toBeTruthy();
        done();
      });
    });
  });
});
