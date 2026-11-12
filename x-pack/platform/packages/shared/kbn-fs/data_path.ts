/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as Fs from 'fs';
import { join, resolve, sep } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';

// Same candidates as `getDataPath` in `@kbn/utils`: the repo `data` folder in
// development, then `/var/lib/kibana` for RPM/DEB packages that do not ship
// `<install>/data`.
const DEFAULT_DATA_PATHS = [join(REPO_ROOT, 'data'), '/var/lib/kibana'];

let configuredDataPath: string | undefined;

const findReadablePath = (paths: string[]): string => {
  for (const candidate of paths) {
    try {
      Fs.accessSync(candidate, Fs.constants.R_OK);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return paths[0];
};

/** Directory `@kbn/fs` may read and write. Honors `setKibanaDataPath` when set. */
export const getKibanaDataPath = (): string => {
  return configuredDataPath ?? findReadablePath(DEFAULT_DATA_PATHS);
};

/**
 * Point file operations at Kibana's configured `path.data`.
 * Call this once that setting is known, before writing files.
 */
export const setKibanaDataPath = (dataPath: string): void => {
  if (typeof dataPath !== 'string' || dataPath.length === 0) {
    throw new Error('Kibana data path must be a non-empty string');
  }
  configuredDataPath = resolve(dataPath);
};

/** Restores default data-directory lookup. Intended for tests. */
export const clearKibanaDataPath = (): void => {
  configuredDataPath = undefined;
};

/** True when `candidate` is `directory` or a path inside it. */
export const isInsideDirectory = (candidate: string, directory: string): boolean => {
  const resolvedCandidate = resolve(candidate);
  const resolvedDirectory = resolve(directory);
  if (resolvedCandidate === resolvedDirectory) {
    return true;
  }
  const prefix = resolvedDirectory.endsWith(sep) ? resolvedDirectory : `${resolvedDirectory}${sep}`;
  return resolvedCandidate.startsWith(prefix);
};
