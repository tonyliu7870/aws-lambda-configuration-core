export class CacheNotFoundError extends Error {
  constructor (message?: string) {
    super(message);
    this.name = 'CacheNotFound';
  }
}

export class CacheExpiredError extends Error {
  constructor (message?: string) {
    super(message);
    this.name = 'CacheExpired';
  }
}

export class DocumentNotFoundError extends Error {
  constructor (message?: string) {
    super(message);
    this.name = 'DocumentNotFound';
  }
}

export class TypeNotFoundError extends Error {
  constructor (type: string) {
    super(`Specified type: ${type} not found. Supported types include "GET", "PUT", "DELETE", "CHECK".`);
    this.name = 'TypeNotFound';
  }
}
