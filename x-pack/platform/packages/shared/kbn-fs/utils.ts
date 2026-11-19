/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { promises as fs, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { getFsDataPath } from './data_path';
import { validateNoPathTraversal, validateFileExtension } from './validations';

export function getSafePath(name: string, volume?: string): { fullPath: string; alias: string } {
  const dataPath = getFsDataPath();
  const fullPath = volume ? join(dataPath, volume, name) : join(dataPath, name);

  const resolvedPath = validateNoPathTraversal(fullPath);

  validateFileExtension(fullPath);

  const alias = volume ? `disk:data/${volume}/${name}` : `disk:data/${name}`;

  return { fullPath: resolvedPath, alias };
}

export async function ensureDirectory(path: string): Promise<void> {
  const dir = dirname(path);

  if (existsSync(dir)) {
    return;
  }

  await fs.mkdir(dir, { recursive: true });
}

export function ensureDirectorySync(path: string): void {
  const dir = dirname(path);

  if (existsSync(dir)) {
    return;
  }

  mkdirSync(dir, { recursive: true });
}
