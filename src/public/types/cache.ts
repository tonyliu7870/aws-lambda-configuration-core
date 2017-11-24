export type CacheOptions = {
  defaultExpires: number;
}

export type CacheStore = {
  [tableName: string]: {
    [documentName: string]: CacheRecord;
  };
}

export type CacheRecord = {
  data: object;
  expires: number;
};
