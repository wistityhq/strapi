import * as usersPermissions from '../services/users-permissions';
import * as user from '../services/user';
import * as jwt from '../services/jwt';

type S = {
  ['users-permissions']: typeof usersPermissions;
  user: typeof user;
  jwt: typeof jwt;
};

export function getService<T extends keyof S>(name: T): S[T];
