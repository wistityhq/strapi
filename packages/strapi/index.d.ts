import { DatabaseManager, Repository } from 'strapi-database';

interface Strapi {
  db: DatabaseManager;

  query(model: string, plugin: string): Repository;
  start(cb?: () => void): void;
}

export default function createStrapi(opts: any): Strapi;

declare global {
  const strapi: Strapi;
}
