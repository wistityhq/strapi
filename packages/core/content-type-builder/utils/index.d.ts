import * as components from '../services/components';
import * as builder from '../services/builder';
import * as contentTypes from '../services/content-types';

type S = {
  ['content-types']: typeof contentTypes;
  components: typeof components;
  builder: typeof builder;
};

export function getService<T extends keyof S>(name: T): S[T];
