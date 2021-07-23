import * as locales from '../services/locales';
import * as permissions from '../services/permissions';
import * as contentTypes from '../services/content-types';
import * as metrics from '../services/metrics';
import * as entityServiceDecorator from '../services/entity-service-decorator';
import * as coreAPI from '../services/core-api';
import * as ISOLocales from '../services/iso-locales';
import * as localizations from '../services/localizations';

type S = {
  permissions: typeof permissions;
  metrics: typeof metrics;
  locales: typeof locales;
  localizations: typeof localizations;
  ['iso-locales']: typeof ISOLocales;
  ['content-types']: typeof contentTypes;
  ['entity-service-decorator']: typeof entityServiceDecorator;
  ['core-api']: typeof coreAPI;
};

export function getService<T extends keyof S>(name: T): S[T];
