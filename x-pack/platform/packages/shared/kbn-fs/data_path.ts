/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { accessSync, constants } from 'fs';
import { dirname, join, resolve, sep } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';

// Same candidates as `@kbn/utils` `getDataPath`. This package is shared-common and
// cannot import that server package. `data_path.test.ts` asserts the two stay equal.
const DEFAULT_DATA_PATH_CANDIDATES = [join(REPO_ROOT, 'data'), '/var/lib/kibana'];

const firstReadable = (candidates: readonly string[]): string => {
  const found = candidates.find((candidate) => {
    try {
      accessSync(candidate, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  });
  return found ?? candidates[0];
};

/**
 * Directory `@kbn/fs` confines file operations to.
 * Pass Kibana's configured `path.data`. When omitted, uses the first readable
 * default (`<install>/data`, then `/var/lib/kibana`).
 */
export const resolveFsDataPath = (dataPath?: string): string => {
  const candidate =
    dataPath === undefined ? firstReadable(DEFAULT_DATA_PATH_CANDIDATES) : dataPath.trim();
  if (!candidate) {
    throw new Error('Kibana data path must be a non-empty string');
  }

  const resolved = resolve(candidate);
  // `dirname` of a filesystem root is the root itself (`/` or `C:\`).
  if (dirname(resolved) === resolved) {
    throw new Error('Kibana data path must not be the filesystem root');
  }

  return resolved;
};

/** Whether `candidate` is `root` or a file/directory inside it (not a sibling prefix). */
export const isInsideDirectory = (root: string, candidate: string): boolean => {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const prefix = resolvedRoot.endsWith(sep) ? resolvedRoot : `${resolvedRoot}${sep}`;
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(prefix);
};
