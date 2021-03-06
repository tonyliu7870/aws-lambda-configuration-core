import { Lambda } from 'aws-sdk';
import { get as _get, pick as _pick } from 'lodash';
import { Cache } from '../lib/cache';
//import { putItem, updatePartialItem, getItem, deleteItem, deletePartialItem } from '../lib/dynamo';
import * as dynamo from '../lib/dynamo';
import { Event, CloudWatchEvent, ConfigEvent, UpdateType, CacheExpiredError, CacheNotFoundError, DocumentNotFoundError, TypeNotFoundError } from '../public';

const bootUpTime = new Date().toISOString();
let count = 0;
export const cache = new Cache({ defaultExpires: parseInt(process.env.cacheTimeout!) || 300 });
export const db = dynamo;

async function execute (event: Event, context: any): Promise<any> {
  cache.cleanExpiredCache();
  // escape warming events
  if ((<CloudWatchEvent>event)['detail-type'] === 'Scheduled Event') {
    console.info(`instance created at ${bootUpTime}`);
    console.info(`#${count++} warm up at ${new Date().toISOString()}`);
    return;
  }

  event = event as ConfigEvent;
  switch (event.type) {
    case UpdateType.get:
      return await getConfig(event.tableName, event.documentName, event.noCache, event.key);
    case UpdateType.put:
      return await setConfig(event.tableName, event.documentName, event.data, event.key);
    case UpdateType.delete:
      return await deleteConfig(event.tableName, event.documentName, event.key);
    case UpdateType.check:
      return await checkConfig(event.tableName, event.documentName, event.noCache, event.key);
  }
  throw new TypeNotFoundError(event.type);
}

async function getConfig (tableName: string = 'lambda-configurations', documentName: string = 'settings', noCache: boolean = false, key?: string | string[]): Promise<any> {
  let document;
  if (noCache) {
    document = await dynamo.getItem(tableName, documentName);
  } else {
    try {
      return cache.getCache(tableName, documentName, key);
    } catch (error) {
      if (error instanceof CacheExpiredError || error instanceof CacheNotFoundError) {
        document = await dynamo.getItem(tableName, documentName);
        cache.setCache(tableName, documentName, document);
      } else {
        throw error;
      }
    }
  }

  return (key === undefined) ? document : _get(document, key);
}

async function checkConfig (tableName?: string, documentName?: string, noCache: boolean = false, key?: string | string[]): Promise<boolean> {
  try {
    return await getConfig(tableName, documentName, noCache, key) !== undefined;
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return false;
    }
    throw error;
  }
}

async function setConfig (tableName: string = 'lambda-configurations', documentName: string = 'settings', data: any, key?: string | string[]): Promise<void> {
  if (key === undefined) {
    await dynamo.putItem(tableName, documentName, data);
    cache.setCache(tableName, documentName, data);
  } else {
    const newConfig = await dynamo.updatePartialItem(tableName, documentName, key, data);
    cache.setCache(tableName, documentName, newConfig);
  }
  return;
}

async function deleteConfig (tableName: string = 'lambda-configurations', documentName: string = 'settings', key?: string | string[]): Promise<void> {
  if (key === undefined) {
    await dynamo.deleteItem(tableName, documentName);
    cache.deleteCache(tableName, documentName);
  } else {
    const newConfig = await dynamo.deletePartialItem(tableName, documentName, key);
    cache.setCache(tableName, documentName, newConfig);
  }
  return;
}

export function handler (event: any, context: any, callback: Function): Promise<any> {
  return Promise.resolve(execute(event, context))
    .then(result => callback(null, result))
    .catch(error => callback(error));
}
