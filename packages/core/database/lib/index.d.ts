type BooleanWhere<T> = {
  $and?: WhereParams<T>[];
  $or?: WhereParams<T>[];
  $not?: WhereParams<T>;
};

type WhereParams<T> = {
  [K in keyof T]?: T[K];
} &
  BooleanWhere<T>;

type Sortables<T> = {
  // check sortable
  [P in keyof T]: P;
}[keyof T];

type Direction = 'asc' | 'ASC' | 'DESC' | 'desc';

interface FindParams<T> {
  select?: (keyof T)[];
  // TODO: add nested operators & relations
  where?: WhereParams<T>;
  limit?: number;
  offset?: number;
  orderBy?: // TODO: add relations
  | Sortables<T>
    | Sortables<T>[]
    | { [K in Sortables<T>]?: Direction }
    | { [K in Sortables<T>]?: Direction }[];
  // TODO: define nested obj
  populate?: (keyof T)[];
}

interface CreateParams<T> {
  select?: (keyof T)[];
  populate?: (keyof T)[];
  data: T[keyof T];
}

interface CreateManyParams<T> {
  select?: (keyof T)[];
  populate?: (keyof T)[];
  data: T[keyof T][];
}

interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface QueryFromContentType<T extends keyof AllTypes> {
  findOne(params: FindParams<AllTypes[T]>): any;
  findMany(params: FindParams<AllTypes[T]>): any[];
  findWithCount(params: FindParams<AllTypes[T]>): [any[], number];
  findPage(params: FindParams<AllTypes[T]>): { results: any[]; pagination: Pagination };

  create(params: CreateParams<AllTypes[T]>): any;
  createMany(params: CreateManyParams<AllTypes[T]>): { count: number };

  update(params: any): any;
  updateMany(params: any): { count: number };

  delete(params: any): any;
  deleteMany(params: any): { count: number };

  count(params: any): number;

  attachRelations(id: ID, data: any): any;
  updateRelations(id: ID, data: any): any;
  deleteRelations(id: ID): any;
}

interface ModelConfig {
  tableName: string;
  [k: string]: any;
}

interface ConnectionConfig {}

interface DatabaseConfig {
  connection: ConnectionConfig;
  models: ModelConfig[];
}

interface DatabaseSchema {
  sync(): Promise<void>;
  reset(): Promise<void>;
  create(): Promise<void>;
  drop(): Promise<void>;
}
export interface Database {
  schema: DatabaseSchema;

  query<T extends keyof AllTypes>(uid: T): QueryFromContentType<T>;
}
export class Database implements Database {
  static transformContentTypes(contentTypes: any[]): ModelConfig[];
  static init(config: DatabaseConfig): Promise<Database>;
}
