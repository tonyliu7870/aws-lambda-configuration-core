import { get as _get, set as _set, cloneDeep as _clone, pick as _pick } from 'lodash';

import { CacheOptions, CacheStore, CacheRecord, CacheNotFoundError, CacheExpiredError } from '../public';

export class Cache {
  public cacheStore: CacheStore = {};
  /** @type {number} defaultExpires number of milliseconds to expires. Note: expires internally count as millisecond but you can only configure it in second */
  public defaultExpires: number = 300 * 1000;

  constructor (options: Partial<CacheOptions> = {}) {
    this.config(options);
  }

  public config (options: Partial<CacheOptions> = {}): void {
    if (options.defaultExpires !== undefined) {
      this.defaultExpires = options.defaultExpires * 1000;
    }
  }

  public setCache (tableName: string, documentName: string, data: object): void {
    _set(this.cacheStore, [tableName, documentName], { expires: Date.now() + this.defaultExpires, data: _clone(data) });
  }

	public getCache<T> (tableName: string, documentName: string, key?: string | string[]): T | undefined {
    const cache: any = _get(this.cacheStore, `${tableName}.${documentName}`);
    if (!cache) {
      throw new CacheNotFoundError();
    } else if (cache.expires < Date.now()) {
      throw new CacheExpiredError();
    }
    return (key === undefined) ? cache.data : _get(cache.data, key) as T;
  }

  public deleteCache (tableName: string, documentName: string): void {
    if (this.cacheStore[tableName] && this.cacheStore[tableName][documentName]) {
      delete this.cacheStore[tableName][documentName];
      if (Object.keys(this.cacheStore[tableName]).length === 0) delete this.cacheStore[tableName];
    }
  }

  public cleanExpiredCache (): void {
    const timestamp = Date.now();
    Object.keys(this.cacheStore).forEach(table => {
      Object.keys(this.cacheStore[table]).forEach(document => {
        if (this.cacheStore[table][document].expires < timestamp) delete this.cacheStore[table][document];
      });
    });
  }
}
