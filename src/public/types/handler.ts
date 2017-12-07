// This file should synchronize/compatible with all libraries and other repository

export type Event = CloudWatchEvent | ConfigEvent;

export type CloudWatchEvent = {
  account: string;
  region: string;
  detail: object,
  'detail-type': 'Scheduled Event',
  source: string;
  time: string;
  id: string;
  resources: string[];
}

export type ConfigEvent = {
  tableName: string;
  documentName: string;
  type: string;
  key?: string | string[];
  data?: any;
  noCache?: boolean;
}

export enum UpdateType {
  get = 'GET',
  put = 'PUT',
  delete = 'DELETE',
  check = 'CHECK',
}
