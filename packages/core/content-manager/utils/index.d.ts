import * as components from '../services/components';
import * as configuration from '../services/configuration';
import * as contentTypes from '../services/content-types';
import * as dataMapper from '../services/data-mapper';
import * as entityManager from '../services/entity-manager';
import * as metris from '../services/metris';
import * as permissionChecker from '../services/permission-checker';
import * as permission from '../services/permission';
import * as uid from '../services/uid';

type S = {
  ['content-types']: typeof contentTypes;
  ['data-mapper']: typeof dataMapper;
  ['entity-manager']: typeof entityManager;
  ['permission-checker']: typeof permissionChecker;
  components: typeof components;
  configuration: typeof configuration;
  metris: typeof metris;
  permission: typeof permission;
  uid: typeof uid;
};

export function getService<T extends keyof S>(name: T): S[T];
