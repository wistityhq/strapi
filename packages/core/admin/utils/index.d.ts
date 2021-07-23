import * as role from '../services/role';
import * as user from '../services/user';
import * as permission from '../services/permission';
import * as contentType from '../services/content-type';
import * as metrics from '../services/metrics';

type S = {
  role: typeof role;
  user: typeof user;
  permission: typeof permission;
  ['content-type']: typeof contentType;
  metrics: typeof metrics;
};

export function getService<T extends keyof S>(name: T): S[T];
