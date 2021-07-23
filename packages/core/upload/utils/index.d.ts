import * as upload from '../services/Upload';

type S = {
  upload: typeof upload;
};

export function getService<T extends keyof S>(name: T): S[T];
