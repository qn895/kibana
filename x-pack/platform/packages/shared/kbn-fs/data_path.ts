/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { accessSync, constants } from 'fs';
import { join, resolve, sep } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';

// Same candidates as Kibana's default `path.data` (`@kbn/utils` getDataPath).
// DEB and RPM packages install Kibana under `/usr/share/kibana` (owned by root).
// `<install>/data` is not writable by the kibana user; `/var/lib/kibana` is.
const DEFAULT_DATA_PATH_CANDIDATES = [join(REPO_ROOT, 'data'), '/var/lib/kibana'];

const isReadable = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * First readable candidate, otherwise the first candidate.
 * `isReadable` is injectable so tests don't depend on the host filesystem.
 */
export const resolveDefaultDataPath = (
  candidates: readonly string[] = DEFAULT_DATA_PATH_CANDIDATES,
  canRead: (path: string) => boolean = isReadable
): string => candidates.find((candidate) => canRead(candidate)) ?? candidates[0];

let dataPathOverride: string | undefined;
let cachedDefaultDataPath: string | undefined;

/** Absolute directory `@kbn/fs` confines file operations to. */
export const getFsDataPath = (): string => {
  if (dataPathOverride) {
    return dataPathOverride;
  }
  if (!cachedDefaultDataPath) {
    cachedDefaultDataPath = resolve(resolveDefaultDataPath());
  }
  return cachedDefaultDataPath;
};

/**
 * Confine `@kbn/fs` operations to Kibana's configured `path.data`.
 * Call once at plugin startup, before any file operation.
 */
export const setFsDataPath = (dataPath: string): void => {
  const trimmed = dataPath?.trim();
  if (!trimmed) {
    throw new Error('Kibana data path must be a non-empty string');
  }
  dataPathOverride = resolve(trimmed);
};

/** Clears a configured data path so later calls use the default discovery again. */
export const resetFsDataPath = (): void => {
  dataPathOverride = undefined;
  cachedDefaultDataPath = undefined;
};

/** Whether `candidate` is `root` or a file/directory inside it (not a sibling prefix). */
export const isInsideDirectory = (root: string, candidate: string): boolean => {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const prefix = resolvedRoot.endsWith(sep) ? resolvedRoot : `${resolvedRoot}${sep}`;
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(prefix);
};
