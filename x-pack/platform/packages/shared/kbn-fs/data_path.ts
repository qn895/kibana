/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isAbsolute, relative, resolve, sep } from 'path';
import { getDataPath } from '@kbn/utils';

let configuredDataPath: string | undefined;
let defaultDataPath: string | undefined;

/**
 * Directory `@kbn/fs` may read and write. Honors `setKibanaDataPath` when set, otherwise
 * uses the same default as the `path.data` setting (`getDataPath` from `@kbn/utils`),
 * resolved once and cached so the boundary does not change between calls.
 */
export const getKibanaDataPath = (): string => {
  if (configuredDataPath) {
    return configuredDataPath;
  }
  defaultDataPath = defaultDataPath ?? resolve(getDataPath());
  return defaultDataPath;
};

/**
 * Point file operations at Kibana's configured `path.data`.
 * Idempotent for the same value; throws if called again with a different directory.
 */
export const setKibanaDataPath = (dataPath: string): void => {
  if (typeof dataPath !== 'string' || dataPath.length === 0) {
    throw new Error('Kibana data path must be a non-empty string');
  }
  const resolved = resolve(dataPath);
  if (configuredDataPath !== undefined && configuredDataPath !== resolved) {
    throw new Error(
      `Kibana data path is already set to ${configuredDataPath}; refusing to change it to ${resolved}`
    );
  }
  configuredDataPath = resolved;
};

/** Restores default data-directory lookup. Intended for tests. */
export const clearKibanaDataPath = (): void => {
  configuredDataPath = undefined;
  defaultDataPath = undefined;
};

/** True when `candidate` is `directory` or a path inside it. */
export const isInsideDirectory = (candidate: string, directory: string): boolean => {
  const rel = relative(resolve(directory), resolve(candidate));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
};
