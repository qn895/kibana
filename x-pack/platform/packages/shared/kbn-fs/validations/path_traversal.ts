/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve, sep } from 'path';
import { getFsDataPath } from '../data_path';

export function validateNoPathTraversal(fullPath: string): string {
  const resolvedPath = resolve(fullPath);
  const dataPath = getFsDataPath();
  // Require a path separator so a sibling such as "<data>evil" is not treated as inside "<data>".
  const prefix = dataPath.endsWith(sep) ? dataPath : `${dataPath}${sep}`;

  if (resolvedPath !== dataPath && !resolvedPath.startsWith(prefix)) {
    throw new Error(`Path traversal detected: ${fullPath}`);
  }

  return resolvedPath;
}
