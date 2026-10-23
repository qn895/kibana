/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { join, resolve } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';

// Until Kibana applies path.data, keep the historical repo-local directory so
// existing callers and tests stay confined to a known root.
const DEFAULT_DATA_PATH = resolve(join(REPO_ROOT, 'data'));

let dataPath = DEFAULT_DATA_PATH;

/** Returns the absolute directory @kbn/fs confines file operations to. */
export function getFsDataPath(): string {
  return dataPath;
}

/** Points @kbn/fs file operations at Kibana's configured data directory. */
export function configureFsDataPath(configuredPath: string): void {
  if (typeof configuredPath !== 'string' || configuredPath.trim().length === 0) {
    throw new Error('Kibana data path must be a non-empty string');
  }
  if (configuredPath.includes('\0')) {
    throw new Error('Kibana data path contains a null byte');
  }

  dataPath = resolve(configuredPath);
}
