/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';
import { isInsideDirectory, resolveFsDataPath } from '../data_path';

export function validateNoPathTraversal(fullPath: string, dataPath?: string): string {
  const resolvedPath = resolve(fullPath);

  if (!isInsideDirectory(resolveFsDataPath(dataPath), resolvedPath)) {
    throw new Error(`Path traversal detected: ${fullPath}`);
  }

  return resolvedPath;
}
