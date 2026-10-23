/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { join } from 'path';
import { REPO_ROOT } from '@kbn/repo-info';
import { configureFsDataPath, getFsDataPath } from './data_path';
import { getSafePath } from './utils';
import { validateNoPathTraversal } from './validations/path_traversal';

const DEFAULT_DATA_PATH = join(REPO_ROOT, 'data');

describe('fs data path', () => {
  const originalDataPath = getFsDataPath();

  afterEach(() => {
    configureFsDataPath(originalDataPath);
  });

  it('defaults to the repository data directory', () => {
    expect(getFsDataPath()).toBe(DEFAULT_DATA_PATH);
    expect(getSafePath('ai-kb-artifacts/artifact.zip').fullPath).toBe(
      join(DEFAULT_DATA_PATH, 'ai-kb-artifacts/artifact.zip')
    );
  });

  it('stores files under the configured data directory', () => {
    configureFsDataPath('/var/lib/kibana');

    expect(getFsDataPath()).toBe('/var/lib/kibana');
    expect(getSafePath('ai-kb-artifacts/artifact.zip').fullPath).toBe(
      '/var/lib/kibana/ai-kb-artifacts/artifact.zip'
    );
    expect(getSafePath('artifact.zip', 'ai-kb-artifacts').fullPath).toBe(
      '/var/lib/kibana/ai-kb-artifacts/artifact.zip'
    );
  });

  it('rejects paths that escape the configured data directory', () => {
    configureFsDataPath('/var/lib/kibana');

    expect(() => getSafePath('../../etc/passwd')).toThrow(/Path traversal detected/);
    expect(() => validateNoPathTraversal('/var/lib/kibana-evil/file.txt')).toThrow(
      /Path traversal detected/
    );
    expect(() => validateNoPathTraversal('/usr/share/kibana/data/ai-kb-artifacts/a.zip')).toThrow(
      /Path traversal detected/
    );
  });

  it('allows files directly inside the configured data directory', () => {
    configureFsDataPath('/var/lib/kibana');

    expect(validateNoPathTraversal('/var/lib/kibana/ai-kb-artifacts/artifact.zip')).toBe(
      '/var/lib/kibana/ai-kb-artifacts/artifact.zip'
    );
  });

  it('rejects an empty data path', () => {
    expect(() => configureFsDataPath('')).toThrow(/non-empty string/);
    expect(() => configureFsDataPath('   ')).toThrow(/non-empty string/);
    expect(getFsDataPath()).toBe(originalDataPath);
  });

  it('rejects a data path that contains a null byte', () => {
    expect(() => configureFsDataPath('/var/lib/kibana\0')).toThrow(/null byte/);
    expect(getFsDataPath()).toBe(originalDataPath);
  });
});
